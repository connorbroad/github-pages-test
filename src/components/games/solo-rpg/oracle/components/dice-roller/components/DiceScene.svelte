<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import * as THREE from "three";
    import * as CANNON from "cannon-es";
    import {
        createDie,
        createDieBody,
        getDieResult,
        getUprightQuaternion,
        type DieType,
    } from "../scripts/dice3d";

    export let numDice: number = 1;
    export let numSides: number = 6;
    export let rolling: boolean = false;

    const dispatch = createEventDispatcher();

    let container: HTMLDivElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let world: CANNON.World;

    let diceMeshes: THREE.Mesh[] = [];
    let diceBodies: CANNON.Body[] = [];
    let animationId: number;
    let isSimulating = false;

    // Interaction state
    let isDragging = false;
    let dragConstraint: CANNON.PointToPointConstraint | null = null;
    let mouseBody: CANNON.Body;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let dragPlane: THREE.Plane;
    let dragPlaneMesh: THREE.Mesh; // Invisible mesh for raycasting

    // Track mouse velocity for throw
    let lastMousePos = new CANNON.Vec3();
    let mouseVelocity = new CANNON.Vec3();
    let lastTime = 0;

    // Map numSides to DieType
    function getDieType(sides: number): DieType {
        if ([4, 6, 8, 10, 12, 20, 100].includes(sides)) {
            return sides as DieType;
        }
        return 6; // Fallback
    }

    function initScene() {
        if (!container) return;

        // Scene
        scene = new THREE.Scene();
        scene.background = null;

        // Camera
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        camera.position.set(0, 15, 0); // Higher up
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 3);
        dirLight.position.set(5, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        scene.add(dirLight);

        // Physics World
        world = new CANNON.World();
        world.gravity.set(0, -20, 0); // Stronger gravity for snappier rolls

        // Floor
        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({ mass: 0 }); // Static
        floorBody.addShape(floorShape);
        floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(floorBody);

        // Mouse interaction setup
        const sphereShape = new CANNON.Sphere(0.1);
        mouseBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.KINEMATIC,
            position: new CANNON.Vec3(0, 0, 0),
        });
        mouseBody.addShape(sphereShape);
        mouseBody.collisionFilterGroup = 0; // Don't collide with anything
        mouseBody.collisionFilterMask = 0;
        world.addBody(mouseBody);

        // Drag plane (invisible) for raycasting against a plane at a certain height
        dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -5); // Plane at y=5

        // Add events
        container.addEventListener("pointerdown", onPointerDown);
        container.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
    }

    let wallBodies: CANNON.Body[] = [];

    function updateDice() {
        if (!scene || !world) return;

        // Clear existing
        diceMeshes.forEach((mesh) => scene.remove(mesh));
        diceBodies.forEach((body) => world.removeBody(body));
        wallBodies.forEach((body) => world.removeBody(body));
        diceMeshes = [];
        diceBodies = [];
        wallBodies = [];

        const type = getDieType(numSides);
        const spacing = 1.0;
        const totalWidth = (numDice - 1) * spacing;
        const startX = -totalWidth / 2;

        // Adjust camera
        let visibleWidth = 5;
        if (camera) {
            const requiredWidth = Math.max(12, totalWidth + 8);
            visibleWidth = requiredWidth;
            const distance = requiredWidth / (2 * Math.tan(Math.PI / 8));
            const baseDist = 10;
            const newDist = Math.max(baseDist, distance);
            camera.position.set(0, newDist * 0.8, newDist * 0.3);
            camera.lookAt(0, 0, 0);
        }

        // Add Walls
        const wallThickness = 1;
        const wallHeight = 20;
        const wallOffset = visibleWidth / 2;

        // Materials
        const wallMaterial = new CANNON.Material({
            friction: 0.1,
            restitution: 0.5,
        });

        // Left Wall
        const leftWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        leftWall.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 10)));
        leftWall.position.set(-wallOffset - wallThickness, 0, 0);
        world.addBody(leftWall);
        wallBodies.push(leftWall);

        // Right Wall
        const rightWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        rightWall.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 10)));
        rightWall.position.set(wallOffset + wallThickness, 0, 0);
        world.addBody(rightWall);
        wallBodies.push(rightWall);

        // Top Wall (Back)
        const topWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        topWall.addShape(new CANNON.Box(new CANNON.Vec3(visibleWidth, wallHeight, wallThickness)));
        topWall.position.set(0, 0, -5 - wallThickness); // Fixed depth for now
        world.addBody(topWall);
        wallBodies.push(topWall);

        // Bottom Wall (Front)
        const bottomWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        bottomWall.addShape(
            new CANNON.Box(new CANNON.Vec3(visibleWidth, wallHeight, wallThickness))
        );
        bottomWall.position.set(0, 0, 5 + wallThickness);
        world.addBody(bottomWall);
        wallBodies.push(bottomWall);

        // Arrange dice in a spiral (Phyllotaxis)
        // This packs them efficiently around the center
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < numDice; i++) {
            const size = 1.5;

            // Calculate position
            // Radius grows with sqrt of index to maintain constant density
            // Scale factor determines spacing
            const dist = numDice > 1 ? Math.sqrt(i) * 2.5 : 0;
            const angle = i * goldenAngle;

            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const y = size / 2; // On the floor

            // Mesh
            const dieMesh = createDie(type, {
                color: 0x3b82f6,
                labelColor: 0xffffff,
                size,
            });
            dieMesh.position.set(x, y, z);

            // Set initial rotation to show max number up
            const uprightQuat = getUprightQuaternion(type);
            dieMesh.quaternion.copy(uprightQuat);

            scene.add(dieMesh);
            diceMeshes.push(dieMesh);

            // Body
            const dieBody = createDieBody(type, size, new THREE.Vector3(x, y, z));
            dieBody.quaternion.copy(uprightQuat as any);

            world.addBody(dieBody);
            diceBodies.push(dieBody);
        }
    }

    // Interaction Handlers
    function getRayIntersection(clientX: number, clientY: number): THREE.Vector3 | null {
        if (!container || !camera) return null;

        const rect = container.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Cast ray against a virtual horizontal plane at height 5
        const targetZ = new THREE.Vector3();
        raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -5), targetZ);

        if (targetZ) return targetZ;
        return null;
    }

    function onPointerDown(e: PointerEvent) {
        if (isSimulating) return; // Don't grab while rolling result

        const point = getRayIntersection(e.clientX, e.clientY);
        if (!point) return;

        isDragging = true;

        // Move mouse body to click point
        mouseBody.position.set(point.x, point.y, point.z);
        lastMousePos.copy(mouseBody.position);
        lastTime = performance.now();

        // Wake up all dice and attract them to the mouse body
        diceBodies.forEach((body) => {
            body.wakeUp();
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);

            // Create a constraint for each die to the mouse body
            // We attach them with a bit of slack so they dangle
            // Use a Spring or PointToPoint? Let's try PointToPoint with some logic locally
            // Actually, let's just use a spring force in the animation loop for "magnetic" pickup
            // Or create a constraint on the fly.

            // Let's go with a simple approach:
            // When dragging, we apply a force to all dice towards the mouse position
            // This makes them swarm the cursor
        });

        // Disable orbit controls if we had them (we don't here)
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging) return;

        const point = getRayIntersection(e.clientX, e.clientY);
        if (point) {
            // Update mouse body position (kinematic)
            mouseBody.position.set(point.x, point.y, point.z);

            // Calculate velocity of mouse for throw
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            if (dt > 0.01) {
                const vel = new CANNON.Vec3();
                mouseBody.position.vsub(lastMousePos, vel);
                vel.scale(1 / dt, mouseVelocity); // v = dx / dt

                // Smooth it a bit maybe?

                lastMousePos.copy(mouseBody.position);
                lastTime = now;
            }
        }
    }

    function onPointerUp(e: PointerEvent) {
        if (!isDragging) return;

        isDragging = false;

        // Apply throw velocity to all dice
        const throwForce = 1.0;

        // If mouse wasn't moving much, just drop them
        const speed = mouseVelocity.length();

        diceBodies.forEach((body) => {
            if (speed > 2) {
                // Apply the mouse velocity as impulse
                const impulse = new CANNON.Vec3();
                mouseVelocity.scale(body.mass * 0.5, impulse); // Tune power
                body.velocity.copy(mouseVelocity);

                // Add some randomness so they don't all fly identically
                body.angularVelocity.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                );
            }
        });

        if (speed > 2) {
            dispatch("rollStart");
            isSimulating = true;
            checkStopped();
        }
    }

    function rollDice() {
        if (!world || diceBodies.length === 0) return;

        isSimulating = true;

        diceBodies.forEach((body) => {
            // Reset position
            body.position.y = 10 + Math.random() * 5;
            body.position.x = (Math.random() - 0.5) * 5;
            body.position.z = (Math.random() - 0.5) * 5;

            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);

            // Apply random impulse
            const force = 20;
            body.applyImpulse(
                new CANNON.Vec3(
                    (Math.random() - 0.5) * force,
                    -force,
                    (Math.random() - 0.5) * force
                ),
                new CANNON.Vec3(0, 0, 0)
            );

            // Apply random rotation
            body.angularVelocity.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
        });

        // Check for stop
        checkStopped();
    }

    function checkStopped() {
        if (!isSimulating) return;

        // Check if all bodies are sleeping or slow
        const allStopped = diceBodies.every((body) => {
            return (
                body.velocity.lengthSquared() < 0.01 && body.angularVelocity.lengthSquared() < 0.01
            );
        });

        if (allStopped) {
            // Wait a bit more to be sure?
            setTimeout(() => {
                if (isSimulating) {
                    // Double check
                    isSimulating = false;
                    const results = diceMeshes.map((mesh) => getDieResult(mesh));
                    dispatch("rollComplete", results);
                }
            }, 500);
        } else {
            setTimeout(checkStopped, 200);
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);

        if (world) {
            // Apply drag forces
            // Apply drag forces
            if (isDragging) {
                diceBodies.forEach((body) => {
                    // Attract to mouse
                    const force = new CANNON.Vec3();
                    mouseBody.position.vsub(body.position, force);

                    const distance = force.length();
                    // Avoid division by zero
                    if (distance > 0.001) {
                        const direction = force.clone();
                        direction.scale(1 / distance, direction); // Normalize

                        // Spring-like force with rest length to prevent excessive clustering
                        const restLength = 1.5;
                        const stiffness = 80; // Reduced from 150
                        const damping = 5;

                        // F = -k * (x - x0) - c * v
                        // Force pulls towards Mouse (equilibrium x0)
                        // Actually, distance is (Body - Mouse), so Displacement is (distance - restLength)

                        const stretch = Math.max(0, distance - restLength);
                        const springForceMagnitude = stretch * stiffness;

                        const springForce = new CANNON.Vec3();
                        direction.scale(springForceMagnitude, springForce);

                        // Damping force
                        const v = new CANNON.Vec3();
                        body.velocity.scale(damping, v);
                        springForce.vsub(v, springForce);

                        // Apply force directly to the body's force accumulator (Center of Mass)
                        body.force.x += springForce.x;
                        body.force.y += springForce.y;
                        body.force.z += springForce.z;

                        // "Swirl" effect: Add gentle torque based on movement
                        // We cross the velocity with up vector to get a roll axis perpendicular to movement
                        const velocity = body.velocity;
                        const speed = velocity.length();

                        if (speed > 0.1) {
                            const rollAxis = new CANNON.Vec3();
                            velocity.cross(new CANNON.Vec3(0, 1, 0), rollAxis);
                            rollAxis.normalize();

                            // Scale torque by speed (gentle factor)
                            // We want it to "roll" along the movement
                            const torqueMagnitude = speed * 1.5;
                            const torque = new CANNON.Vec3();
                            rollAxis.scale(torqueMagnitude, torque);

                            body.torque.x += torque.x;
                            body.torque.y += torque.y;
                            body.torque.z += torque.z;
                        }
                    }

                    // Explicitly dampen angular velocity to prevent spinning out of control
                    // Less damping than before to allow the swirl
                    body.angularVelocity.scale(0.9, body.angularVelocity);
                });
            }

            world.step(1 / 60);

            // Sync meshes
            for (let i = 0; i < diceMeshes.length; i++) {
                const mesh = diceMeshes[i];
                const body = diceBodies[i];

                mesh.position.copy(body.position as any);
                mesh.quaternion.copy(body.quaternion as any);
            }
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function handleResize() {
        if (!container || !camera || !renderer) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // Watch for changes
    $: if (numDice || numSides) {
        updateDice();
    }

    $: if (rolling && !isSimulating) {
        rollDice();
    }

    onMount(() => {
        initScene();
        updateDice();
        animate();
        window.addEventListener("resize", handleResize);
    });

    onDestroy(() => {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener("resize", handleResize);
        if (container) {
            container.removeEventListener("pointerdown", onPointerDown);
            container.removeEventListener("pointermove", onPointerMove);
        }
        window.removeEventListener("pointerup", onPointerUp);

        if (renderer) {
            renderer.dispose();
        }
    });
</script>

<div
    class="h-[200px] w-full overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,var(--bg-secondary)_0%,var(--bg-primary)_100%)] shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"
    bind:this={container}>
</div>
