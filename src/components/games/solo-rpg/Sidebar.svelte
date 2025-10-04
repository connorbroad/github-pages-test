<script lang="ts">
    export let currentView: "home" | "tools" | "oracle" | "settings" = "home";
    export let onNavigate: (
        view: "home" | "tools" | "oracle" | "settings",
    ) => void = () => {};
</script>

<aside class="sidebar">
    <div class="app-icon">
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>
    </div>

    <nav>
        <div class="nav-main">
            <button
                class="nav-item"
                class:active={currentView === "home"}
                on:click={() => onNavigate("home")}
                aria-label="Home"
            >
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                    ></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span class="label">Home</span>
            </button>

            <button
                class="nav-item"
                class:active={currentView === "oracle"}
                on:click={() => onNavigate("oracle")}
                aria-label="Oracle"
            >
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                <span class="label">Oracle</span>
            </button>

            <button
                class="nav-item"
                class:active={currentView === "tools"}
                on:click={() => onNavigate("tools")}
                aria-label="Tools"
            >
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                    ></path>
                </svg>
                <span class="label">Tools</span>
            </button>
        </div>

        <div class="nav-bottom">
            <button
                class="nav-item"
                class:active={currentView === "settings"}
                on:click={() => onNavigate("settings")}
                aria-label="Settings"
            >
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="3"></circle>
                    <path
                        d="M12 1v6m0 6v6m8.66-15.66l-4.24 4.24m-4.24 4.24l-4.24 4.24m15.08-1.42l-6-1.73m-6-1.73l-6-1.73m1.42-6.92l1.73 6m1.73 6l1.73 6"
                    ></path>
                </svg>
                <span class="label">Settings</span>
            </button>
        </div>
    </nav>
</aside>

<style>
    .sidebar {
        background-color: #2c2c2c;
        color: #ffffff;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 100;
        display: flex;
        flex-direction: column;
    }

    .app-icon {
        display: none;
    }

    nav {
        display: flex;
        height: 100%;
        flex-direction: column;
    }

    .nav-main {
        display: flex;
    }

    .nav-bottom {
        display: flex;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        padding: 0.75rem;
        background: none;
        border: none;
        color: #b0b0b0;
        cursor: pointer;
        transition: all 0.2s ease;
        flex: 1;
        text-decoration: none;
        min-width: 0;
    }

    .nav-item:hover {
        background-color: #3a3a3a;
        color: #ffffff;
    }

    .nav-item.active {
        background-color: #4a4a4a;
        color: #ffffff;
        border-left: 3px solid #4a9eff;
    }

    .icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
    }

    .label {
        font-size: 0.75rem;
        text-align: center;
        word-break: break-word;
    }

    /* Desktop - Left sidebar */
    @media (min-width: 769px) {
        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 80px;
            height: 100vh;
        }

        .app-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem 0;
            border-bottom: 1px solid #3a3a3a;
        }

        .app-icon svg {
            width: 36px;
            height: 36px;
            stroke: #4a9eff;
        }

        nav {
            flex-direction: column;
            flex: 1;
            justify-content: space-between;
        }

        .nav-main {
            flex-direction: column;
            gap: 0;
        }

        .nav-bottom {
            flex-direction: column;
            margin-top: auto;
        }

        .nav-item {
            padding: 1rem 0.5rem;
            flex: 0 0 auto;
        }

        .nav-item.active {
            border-left: 3px solid #4a9eff;
            border-bottom: none;
        }
    }

    /* Mobile - Bottom bar */
    @media (max-width: 768px) {
        .sidebar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 70px;
            box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
            flex-direction: row;
        }

        nav {
            flex-direction: row;
            padding: 0;
            width: 100%;
            height: 100%;
        }

        .nav-main {
            flex-direction: row;
            flex: 3;
        }

        .nav-bottom {
            flex-direction: row;
            flex: 1;
        }

        .nav-item {
            padding: 0.5rem;
            height: 100%;
            box-sizing: border-box;
            flex: 1;
        }

        .nav-item.active {
            border-left: none;
            border-top: 3px solid #4a9eff;
            padding-top: calc(0.5rem - 3px);
        }

        .label {
            font-size: 0.7rem;
        }

        .icon {
            width: 20px;
            height: 20px;
        }
    }
</style>
