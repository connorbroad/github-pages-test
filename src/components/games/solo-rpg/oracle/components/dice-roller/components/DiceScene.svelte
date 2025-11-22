<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import * as THREE from "three";
    import * as CANNON from "cannon-es";
    import {
        createDie,
        createDieBody,
        getDieResult,
        type DieType,
    } from "../scripts/dice3d";

    export let numDice: number = 1;
    export let numSides: number = 6;
    export let rolling: boolean = false;
    // diceResults is now an output, not input for physics mode
    // But we might want to keep it as a prop if we want to force results?
    // No, user wants physics based.

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
        leftWall.addShape(
            new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 10)),
        );
        leftWall.position.set(-wallOffset - wallThickness, 0, 0);
        world.addBody(leftWall);
        wallBodies.push(leftWall);

        // Right Wall
        const rightWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        rightWall.addShape(
            new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 10)),
        );
        rightWall.position.set(wallOffset + wallThickness, 0, 0);
        world.addBody(rightWall);
        wallBodies.push(rightWall);

        // Top Wall (Back)
        const topWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        topWall.addShape(
            new CANNON.Box(
                new CANNON.Vec3(visibleWidth, wallHeight, wallThickness),
            ),
        );
        topWall.position.set(0, 0, -5 - wallThickness); // Fixed depth for now
        world.addBody(topWall);
        wallBodies.push(topWall);

        // Bottom Wall (Front)
        const bottomWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        bottomWall.addShape(
            new CANNON.Box(
                new CANNON.Vec3(visibleWidth, wallHeight, wallThickness),
            ),
        );
        bottomWall.position.set(0, 0, 5 + wallThickness);
        world.addBody(bottomWall);
        wallBodies.push(bottomWall);

        for (let i = 0; i < numDice; i++) {
            const size = 1.5;
            const x = startX + i * spacing;

            // Mesh
            const dieMesh = createDie(type, {
                color: 0x3b82f6,
                labelColor: 0xffffff,
                size,
            });
            scene.add(dieMesh);
            diceMeshes.push(dieMesh);

            // Body
            const dieBody = createDieBody(
                type,
                size,
                new THREE.Vector3(x, 5 + Math.random() * 2, 0),
            );
            world.addBody(dieBody);
            diceBodies.push(dieBody);
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
                    (Math.random() - 0.5) * force,
                ),
                new CANNON.Vec3(0, 0, 0),
            );

            // Apply random rotation
            body.angularVelocity.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
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
                body.velocity.lengthSquared() < 0.01 &&
                body.angularVelocity.lengthSquared() < 0.01
            );
        });

        if (allStopped) {
            // Wait a bit more to be sure?
            setTimeout(() => {
                if (isSimulating) {
                    // Double check
                    isSimulating = false;
                    const results = diceMeshes.map((mesh) =>
                        getDieResult(mesh),
                    );
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
        if (renderer) {
            renderer.dispose();
        }
    });
</script>

<div class="dice-scene-container" bind:this={container}></div>

<style>
    .dice-scene-container {
        width: 100%;
        height: 200px;
        overflow: hidden;
        border-radius: 12px;
        background: radial-gradient(
            circle at center,
            var(--bg-secondary) 0%,
            var(--bg-primary) 100%
        );
        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
    }
</style>
