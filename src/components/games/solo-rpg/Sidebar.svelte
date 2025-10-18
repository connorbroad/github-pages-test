<script lang="ts">
    export let currentView: "home" | "tools" | "oracle" | "settings" | "map" | "story" | "chronicle" | "characters" = "home";
    export let onNavigate: (
        view: "home" | "tools" | "oracle" | "settings" | "map" | "story" | "chronicle" | "characters",
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1.5em' height='1.5em' {...$$props}><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M16 2h-4c-2.828 0-4.243 0-5.121.946C6 3.893 6 5.416 6 8.462v1.076c0 3.047 0 4.57.879 5.516C7.757 16 9.172 16 12 16h4c2.828 0 4.243 0 5.121-.946c.879-.947.879-2.47.879-5.516V8.462c0-3.046 0-4.57-.879-5.516C20.243 2 18.828 2 16 2"/><path d="M18 16.608c-.012 2.346-.109 3.616-.877 4.444c-.879.948-2.293.948-5.122.948h-4c-2.83 0-4.243 0-5.122-.948C2 20.106 2 18.58 2 15.53v-1.078c0-3.05 0-4.576.879-5.523C3.52 8.237 4.447 8.05 6 8"/></g></svg>                <span class="label"></span>
            </button>

            <button
                class="nav-item"
                class:active={currentView === "chronicle"}
                on:click={() => onNavigate("chronicle")}
                aria-label="Journey"
            >
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                <span class="label"></span>
            </button>

            <button
                class="nav-item"
                class:active={currentView === "characters"}
                on:click={() => onNavigate("characters")}
                aria-label="Characters"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width='2em' height='2em' stroke-width="2" {...$$props}>
                    <path fill="currentColor" d="M4.5 6.75a2.25 2.25 0 1 1 4.5 0a2.25 2.25 0 0 1-4.5 0M6.75 3.5a3.25 3.25 0 1 0 0 6.5a3.25 3.25 0 0 0 0-6.5m5.687 11.645c.538.22 1.215.355 2.063.355c1.881 0 2.921-.668 3.469-1.434a2.9 2.9 0 0 0 .521-1.36a2 2 0 0 0 .01-.137V12.5A1.5 1.5 0 0 0 17 11h-4.63c.24.29.42.629.525 1H17a.5.5 0 0 1 .5.5v.054l-.005.05a1.9 1.9 0 0 1-.34.88c-.327.459-1.037 1.016-2.655 1.016c-.732 0-1.278-.114-1.687-.281c-.082.28-.201.596-.376.926M1.5 13a2 2 0 0 1 2-2H10a2 2 0 0 1 2 2v.084l-.002.04l-.01.135a3.95 3.95 0 0 1-.67 1.806C10.617 16.08 9.263 17 6.75 17s-3.867-.92-4.568-1.934a3.95 3.95 0 0 1-.67-1.807a3 3 0 0 1-.012-.175zm1 .06v.018l.007.083a2.95 2.95 0 0 0 .498 1.336C3.492 15.201 4.513 16 6.75 16s3.258-.799 3.745-1.503a2.95 2.95 0 0 0 .498-1.336q.006-.057.006-.083l.001-.017V13a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1zM13 7.5a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0M14.5 5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5"/></svg>
                <span class="label"></span>
            </button>

            <button
                class="nav-item"
                class:active={currentView === "story"}
                on:click={() => onNavigate("story")}
                aria-label="Lore"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1.5em' height='1.5em' {...$$props}>
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4M2 6h4m-4 4h4m-4 4h4m-4 4h4"/>
                        <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
                    </g>
                </svg>
                <span class="label"></span>
            </button>

            <button
                class="nav-item"
                class:active={currentView === "map"}
                on:click={() => onNavigate("map")}
                aria-label="Map"
            >
                <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="0"
                >
<path fill="currentColor" d="m20.5 3l-.16.03L15 5.1L9 3L3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1l5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5M10 5.47l4 1.4v11.66l-4-1.4zm-5 .99l3-1.01v11.7l-3 1.16zm14 11.08l-3 1.01V6.86l3-1.16z"/></svg>
                
                <span class="label"></span>
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
                    stroke-width="0"><path fill="currentColor" d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.6.6 0 0 0-.18-.03c-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1q.09.03.18.03c.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64zm-1.98-1.71c.04.31.05.52.05.73s-.02.43-.05.73l-.14 1.13l.89.7l1.08.84l-.7 1.21l-1.27-.51l-1.04-.42l-.9.68c-.43.32-.84.56-1.25.73l-1.06.43l-.16 1.13l-.2 1.35h-1.4l-.19-1.35l-.16-1.13l-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7l-1.06.43l-1.27.51l-.7-1.21l1.08-.84l.89-.7l-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13l-.89-.7l-1.08-.84l.7-1.21l1.27.51l1.04.42l.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43l.16-1.13l.2-1.35h1.39l.19 1.35l.16 1.13l1.06.43c.43.18.83.41 1.23.71l.91.7l1.06-.43l1.27-.51l.7 1.21l-1.07.85l-.89.7zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4s-1.79-4-4-4m0 6c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2"/></svg>
                <span class="label"></span>
            </button>
        </div>
    </nav>
</aside>

<style>
    .sidebar {
        background-color: var(--sidebar-bg);
        color: var(--sidebar-text);
        box-shadow: 2px 0 5px var(--shadow-md);
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
        color: var(--sidebar-text-muted);
        cursor: pointer;
        transition: all 0.2s ease;
        flex: 1;
        text-decoration: none;
        min-width: 0;
    }

    .nav-item:hover {
        background-color: var(--sidebar-hover);
        color: var(--sidebar-text);
    }

    .nav-item.active {
        background-color: var(--sidebar-active);
        color: var(--sidebar-text);
        border-left: 3px solid var(--accent-primary);
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
            border-bottom: 1px solid var(--sidebar-border);
        }

        .app-icon svg {
            width: 36px;
            height: 36px;
            stroke: var(--accent-primary);
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
            border-left: 3px solid var(--accent-primary);
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
            height: calc(70px + env(safe-area-inset-bottom));
            box-shadow: 0 -2px 5px var(--shadow-md);
            flex-direction: row;
            padding-bottom: env(safe-area-inset-bottom);
        }

        nav {
            flex-direction: row;
            padding: 0;
            width: 100%;
            height: 70px;
        }

        .nav-main {
            flex-direction: row;
            flex: 5; /* Should match the number of nav items */
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
            border-top: 3px solid var(--accent-primary);
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
