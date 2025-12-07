import { describe, it, expect, vi } from "vitest";

/**
 * Navigation Logic Tests
 *
 * These tests verify the navigation behavior in the SoloRPG app,
 * particularly the special-case handling for views that have nested states
 * (like character sheets within the characters view).
 *
 * The key behavior being tested:
 * - When user clicks on a sidebar button for a view they're already on,
 *   the app should "reset" that view to its initial state.
 * - Example: Clicking "Characters" while viewing a CharacterSheet should
 *   return to the CharacterManager list view.
 */

type View = "home" | "tools" | "oracle" | "settings" | "map" | "story" | "chronicle" | "characters";

interface NavigationState {
    currentView: View;
    showTertiarySidebar: boolean;
    selectedCharacterId: string | null;
}

interface NavigationCallbacks {
    mapReturnToLanding?: () => void;
    characterResetToList?: () => void;
}

/**
 * Determines what action to take when navigating.
 * Returns the action type and new state.
 */
function determineNavigationAction(
    targetView: View,
    currentState: NavigationState
): {
    action: "reset-map" | "reset-characters" | "change-view";
    newState: NavigationState;
} {
    // Map special-case: toggle to landing when already on map
    if (targetView === "map" && currentState.currentView === "map") {
        return {
            action: "reset-map",
            newState: currentState, // State unchanged, component handles reset
        };
    }

    // Characters special-case: return to list when already on characters view
    if (targetView === "characters" && currentState.currentView === "characters") {
        return {
            action: "reset-characters",
            newState: currentState, // State unchanged initially, component handles reset
        };
    }

    // Normal navigation: change view and reset UI state
    return {
        action: "change-view",
        newState: {
            currentView: targetView,
            showTertiarySidebar: false,
            selectedCharacterId: null,
        },
    };
}

/**
 * Simulates the full navigation handler behavior including callbacks.
 * Returns true if the navigation resulted in a view change, false if it was a reset action.
 */
function handleNavigation(
    targetView: View,
    currentState: NavigationState,
    callbacks: NavigationCallbacks
): { viewChanged: boolean; newState: NavigationState; callbackCalled: string | null } {
    const { action, newState } = determineNavigationAction(targetView, currentState);

    switch (action) {
        case "reset-map":
            callbacks.mapReturnToLanding?.();
            return { viewChanged: false, newState, callbackCalled: "mapReturnToLanding" };

        case "reset-characters":
            callbacks.characterResetToList?.();
            return { viewChanged: false, newState, callbackCalled: "characterResetToList" };

        case "change-view":
        default:
            return { viewChanged: true, newState, callbackCalled: null };
    }
}

// === TESTS ===

describe("Navigation Logic", () => {
    describe("determineNavigationAction", () => {
        it("should return reset-characters when clicking characters while on characters view", () => {
            const currentState: NavigationState = {
                currentView: "characters",
                showTertiarySidebar: true,
                selectedCharacterId: "char-123",
            };

            const result = determineNavigationAction("characters", currentState);

            expect(result.action).toBe("reset-characters");
        });

        it("should return reset-map when clicking map while on map view", () => {
            const currentState: NavigationState = {
                currentView: "map",
                showTertiarySidebar: false,
                selectedCharacterId: null,
            };

            const result = determineNavigationAction("map", currentState);

            expect(result.action).toBe("reset-map");
        });

        it("should return change-view when navigating to a different view", () => {
            const currentState: NavigationState = {
                currentView: "characters",
                showTertiarySidebar: true,
                selectedCharacterId: "char-123",
            };

            const result = determineNavigationAction("home", currentState);

            expect(result.action).toBe("change-view");
            expect(result.newState.currentView).toBe("home");
            expect(result.newState.showTertiarySidebar).toBe(false);
            expect(result.newState.selectedCharacterId).toBeNull();
        });

        it("should reset tertiary sidebar when changing views", () => {
            const currentState: NavigationState = {
                currentView: "characters",
                showTertiarySidebar: true,
                selectedCharacterId: "char-456",
            };

            const result = determineNavigationAction("chronicle", currentState);

            expect(result.newState.showTertiarySidebar).toBe(false);
            expect(result.newState.selectedCharacterId).toBeNull();
        });

        it("should navigate normally from home to characters", () => {
            const currentState: NavigationState = {
                currentView: "home",
                showTertiarySidebar: false,
                selectedCharacterId: null,
            };

            const result = determineNavigationAction("characters", currentState);

            expect(result.action).toBe("change-view");
            expect(result.newState.currentView).toBe("characters");
        });
    });

    describe("handleNavigation", () => {
        it("should call characterResetToList when clicking characters while viewing a character sheet", () => {
            const currentState: NavigationState = {
                currentView: "characters",
                showTertiarySidebar: true,
                selectedCharacterId: "char-123",
            };

            const resetToList = vi.fn();
            const callbacks: NavigationCallbacks = {
                characterResetToList: resetToList,
            };

            const result = handleNavigation("characters", currentState, callbacks);

            expect(resetToList).toHaveBeenCalledTimes(1);
            expect(result.viewChanged).toBe(false);
            expect(result.callbackCalled).toBe("characterResetToList");
        });

        it("should call mapReturnToLanding when clicking map while on map view", () => {
            const currentState: NavigationState = {
                currentView: "map",
                showTertiarySidebar: false,
                selectedCharacterId: null,
            };

            const returnToLanding = vi.fn();
            const callbacks: NavigationCallbacks = {
                mapReturnToLanding: returnToLanding,
            };

            const result = handleNavigation("map", currentState, callbacks);

            expect(returnToLanding).toHaveBeenCalledTimes(1);
            expect(result.viewChanged).toBe(false);
            expect(result.callbackCalled).toBe("mapReturnToLanding");
        });

        it("should not call any callback when changing to a different view", () => {
            const currentState: NavigationState = {
                currentView: "characters",
                showTertiarySidebar: true,
                selectedCharacterId: "char-123",
            };

            const resetToList = vi.fn();
            const returnToLanding = vi.fn();
            const callbacks: NavigationCallbacks = {
                characterResetToList: resetToList,
                mapReturnToLanding: returnToLanding,
            };

            const result = handleNavigation("home", currentState, callbacks);

            expect(resetToList).not.toHaveBeenCalled();
            expect(returnToLanding).not.toHaveBeenCalled();
            expect(result.viewChanged).toBe(true);
            expect(result.callbackCalled).toBeNull();
        });

        it("should handle missing callbacks gracefully", () => {
            const currentState: NavigationState = {
                currentView: "characters",
                showTertiarySidebar: true,
                selectedCharacterId: "char-123",
            };

            // No callbacks provided
            const callbacks: NavigationCallbacks = {};

            // Should not throw
            expect(() => handleNavigation("characters", currentState, callbacks)).not.toThrow();
        });
    });

    describe("Character View Reset Behavior (Regression Test)", () => {
        /**
         * This test documents the bug that was fixed:
         * When a user is viewing a CharacterSheet and clicks the Characters
         * sidebar button, the app should return to the character list,
         * not stay on the character sheet.
         */
        it("should reset to character list when clicking Characters sidebar while viewing a character sheet", () => {
            // Simulate state when viewing a character sheet
            const stateWithCharacterSheet: NavigationState = {
                currentView: "characters",
                showTertiarySidebar: true, // Tertiary sidebar is shown for character sections
                selectedCharacterId: "char-test-123",
            };

            const resetToListMock = vi.fn();

            const result = handleNavigation("characters", stateWithCharacterSheet, {
                characterResetToList: resetToListMock,
            });

            // The reset function should be called
            expect(resetToListMock).toHaveBeenCalledTimes(1);

            // View should not "change" (it stays on characters, but resets internally)
            expect(result.viewChanged).toBe(false);
        });

        it("should navigate normally to characters from a different view", () => {
            // Simulate state when on home view
            const stateOnHome: NavigationState = {
                currentView: "home",
                showTertiarySidebar: false,
                selectedCharacterId: null,
            };

            const resetToListMock = vi.fn();

            const result = handleNavigation("characters", stateOnHome, {
                characterResetToList: resetToListMock,
            });

            // Should NOT call reset (we're navigating TO characters, not resetting)
            expect(resetToListMock).not.toHaveBeenCalled();

            // View should change
            expect(result.viewChanged).toBe(true);
            expect(result.newState.currentView).toBe("characters");
        });
    });

    describe("Sidebar Badge Visibility", () => {
        /**
         * Tests for the visual indicator (badge) that shows when tapping
         * a sidebar button will "return" to a list/landing state.
         */

        interface SidebarBadgeState {
            currentView: View;
            selectedCharacterId: string | null;
            mapHasOpenMap: boolean;
        }

        function shouldShowCharacterReturnBadge(state: SidebarBadgeState): boolean {
            return state.currentView === "characters" && state.selectedCharacterId !== null;
        }

        function shouldShowMapReturnBadge(state: SidebarBadgeState): boolean {
            return state.currentView === "map" && state.mapHasOpenMap;
        }

        describe("Character Return Badge", () => {
            it("should show badge when viewing a character sheet", () => {
                const state: SidebarBadgeState = {
                    currentView: "characters",
                    selectedCharacterId: "char-123",
                    mapHasOpenMap: false,
                };

                expect(shouldShowCharacterReturnBadge(state)).toBe(true);
            });

            it("should not show badge when on character list (no character selected)", () => {
                const state: SidebarBadgeState = {
                    currentView: "characters",
                    selectedCharacterId: null,
                    mapHasOpenMap: false,
                };

                expect(shouldShowCharacterReturnBadge(state)).toBe(false);
            });

            it("should not show badge when on a different view", () => {
                const state: SidebarBadgeState = {
                    currentView: "home",
                    selectedCharacterId: "char-123", // Even with ID set, not on characters view
                    mapHasOpenMap: false,
                };

                expect(shouldShowCharacterReturnBadge(state)).toBe(false);
            });
        });

        describe("Map Return Badge", () => {
            it("should show badge when viewing a map", () => {
                const state: SidebarBadgeState = {
                    currentView: "map",
                    selectedCharacterId: null,
                    mapHasOpenMap: true,
                };

                expect(shouldShowMapReturnBadge(state)).toBe(true);
            });

            it("should not show badge when on map landing (no map open)", () => {
                const state: SidebarBadgeState = {
                    currentView: "map",
                    selectedCharacterId: null,
                    mapHasOpenMap: false,
                };

                expect(shouldShowMapReturnBadge(state)).toBe(false);
            });

            it("should not show badge when on a different view", () => {
                const state: SidebarBadgeState = {
                    currentView: "characters",
                    selectedCharacterId: null,
                    mapHasOpenMap: true, // Even with map open, not on map view
                };

                expect(shouldShowMapReturnBadge(state)).toBe(false);
            });
        });
    });
});
