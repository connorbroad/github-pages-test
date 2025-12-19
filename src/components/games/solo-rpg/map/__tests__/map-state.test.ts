import { describe, it, expect, vi, beforeEach } from "vitest";
import { MapState } from "../map-state.svelte";
import * as storageUtils from "../../data/storage-utils";
import * as mapPersistence from "../../data/map-persistence";

// Mock the dependencies
vi.mock("../../data/storage-utils", () => ({
    loadMaps: vi.fn(),
    saveActiveMapId: vi.fn(),
    loadMapMode: vi.fn(() => "edit"),
    saveMapMode: vi.fn(),
    loadCharacters: vi.fn(() => []),
    saveCharacters: vi.fn(),
}));

vi.mock("../../data/map-persistence", () => ({
    updateMap: vi.fn(),
    updateMapObject: vi.fn(),
    saveCombatState: vi.fn(),
    addMap: vi.fn(),
    deleteMap: vi.fn(),
}));

describe("MapState", () => {
    let state: MapState;
    const mockMapId = "map-123";
    const mockCampaignId = "camp-456";
    const mockMap: any = {
        id: mockMapId,
        campaignId: mockCampaignId,
        name: "Test Map",
        objects: [],
        view: { x: 10, y: 20, zoom: 2 },
        combatState: {
            initiativeOrder: [],
            currentTurnIndex: 0,
            hasActiveEncounter: false,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        state = new MapState();
        vi.mocked(storageUtils.loadMaps).mockReturnValue([mockMap]);
    });

    describe("Initialization & Loading", () => {
        it("should load maps for a campaign during init", () => {
            state.init(mockCampaignId);
            expect(state.maps).toHaveLength(1);
            expect(state.maps[0].id).toBe(mockMapId);
        });

        it("should setup state correctly when loading a map", () => {
            state.loadMap(mockMapId);
            expect(state.map?.id).toBe(mockMapId);
            expect(state.camera).toEqual({ x: 10, y: 20, zoom: 2 });
            expect(storageUtils.saveActiveMapId).toHaveBeenCalledWith(mockMapId);
        });
    });

    describe("UI Modes & Selection", () => {
        beforeEach(() => {
            state.init(mockCampaignId);
            state.loadMap(mockMapId);
        });

        it("should toggle map mode and persist it", () => {
            state.setMapMode("play");
            expect(state.mapMode).toBe("play");
            expect(storageUtils.saveMapMode).toHaveBeenCalledWith("play");
        });

        it("should clear selection when switching modes", () => {
            state.selectedObjectId = "obj-1";
            state.setMapMode("play");
            expect(state.selectedObjectId).toBeNull();
        });

        it("should update edit mode and clear selection when leaving object mode", () => {
            state.editMode = "object";
            state.selectedObjectId = "obj-1";
            state.setEditMode("move");
            expect(state.editMode).toBe("move");
            expect(state.selectedObjectId).toBeNull();
        });

        it("should correctly identify selected object", () => {
            const obj = { id: "obj-1", type: "square", color: "red" } as any;
            state.map!.objects = [obj];
            state.selectObject("obj-1");
            expect(state.selectedObject).toEqual(obj);
            expect(state.color).toBe("red");
        });
    });

    describe("Object Management", () => {
        beforeEach(() => {
            state.init(mockCampaignId);
            state.loadMap(mockMapId);
            state.map!.objects = [
                { id: "obj-1", type: "square", x: 0, y: 0, w: 10, h: 10, color: "blue" } as any,
            ];
        });

        it("should update object and persist changes", () => {
            const initialTrigger = state.renderTrigger;
            state.updateObject("obj-1", { color: "green" });
            expect(state.map!.objects[0].color).toBe("green");
            expect(mapPersistence.updateMapObject).toHaveBeenCalled();
            expect(state.renderTrigger).toBe(initialTrigger + 1);
        });

        it("should delete object and clear local selection", () => {
            const initialTrigger = state.renderTrigger;
            state.selectedObjectId = "obj-1";
            state.deleteObject("obj-1");
            expect(state.map!.objects).toHaveLength(0);
            expect(state.selectedObjectId).toBeNull();
            expect(mapPersistence.updateMap).toHaveBeenCalled();
            expect(state.renderTrigger).toBe(initialTrigger + 1);
        });

        it("should update multiple fields via updateMapData", () => {
            const initialTrigger = state.renderTrigger;
            state.updateMapData((m) => {
                m.name = "Renamed";
                m.objects.push({ id: "obj-2" } as any);
            });
            expect(state.map!.name).toBe("Renamed");
            expect(state.map!.objects).toHaveLength(2);
            expect(mapPersistence.updateMap).toHaveBeenCalled();
            expect(state.renderTrigger).toBe(initialTrigger + 1);
        });
    });

    describe("Combat State", () => {
        beforeEach(() => {
            state.init(mockCampaignId);
            state.loadMap(mockMapId);
        });

        it("should set initiative and persist", () => {
            const order = [
                {
                    objectId: "obj-1",
                    name: "Hero",
                    initiative: 20,
                    currentHP: 10,
                    maxHP: 10,
                    isActive: true,
                },
            ];
            state.setInitiative(order, 0);
            expect(state.initiativeOrder).toEqual(order);
            expect(state.hasActiveEncounter).toBe(true);
            expect(mapPersistence.saveCombatState).toHaveBeenCalled();
        });

        it("should end encounter and clear relevant fields", () => {
            state.hasActiveEncounter = true;
            state.initiativeOrder = [{} as any];
            state.endEncounter();
            expect(state.hasActiveEncounter).toBe(false);
            expect(state.initiativeOrder).toHaveLength(0);
            expect(state.encounterSelectedCreature).toBeNull();
            expect(mapPersistence.saveCombatState).toHaveBeenCalled();
        });
    });

    describe("Camera Control", () => {
        it("should update camera and map view", () => {
            state.loadMap(mockMapId);
            const initialTrigger = state.renderTrigger;
            state.setCamera(50, 60, 3);
            expect(state.camera).toEqual({ x: 50, y: 60, zoom: 3 });
            expect(state.map!.view).toEqual({ x: 50, y: 60, zoom: 3 });
            expect(state.renderTrigger).toBe(initialTrigger + 1); // Only 1 increment now in setCamera
        });

        it("should set pending focus for camera centering", () => {
            state.loadMap(mockMapId);
            state.map!.objects = [{ id: "obj-1" } as any];
            state.centerOnObject("obj-1", 10, 10, true);
            expect(state.pendingCameraFocus).toEqual({
                objectId: "obj-1",
                offsetX: 10,
                offsetY: 10,
                animate: true,
            });
        });
    });
});
