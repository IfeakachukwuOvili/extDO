// Inject sidebar and toggle tab for the task manager
(function() {
    // Prevent multiple injections
    if (window.__taskManagerInjected) {
        // If already injected, just toggle the existing sidebar
        const existingSidebar = document.getElementById('task-manager-sidebar');
        if (existingSidebar) {
            existingSidebar.classList.toggle('open');
        }
        return;
    }
    
    window.__taskManagerInjected = true;

    function initSidebar() {
        // Create sidebar if it doesn't exist
        let sidebar = document.getElementById('task-manager-sidebar');
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.id = 'task-manager-sidebar';
            
            // Create sidebar content container
            const sidebarContent = document.createElement('div');
            sidebarContent.id = 'task-sidebar-content';
            sidebar.appendChild(sidebarContent);
            
            document.body.appendChild(sidebar);
        }

        // Toggle sidebar
        sidebar.classList.add('open');
        renderTaskManagerSidebar();

        // Add click handler for the folder icon
        const folderIcon = document.querySelector('#task-manager-tab');
        if (folderIcon) {
            folderIcon.addEventListener('click', () => {
                const sidebar = document.getElementById('task-manager-sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('open');
                }
            });
        }
    }

    // Create style
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = chrome.runtime.getURL('content.css');
    document.head.appendChild(style);

    // Toggle tab/button
    const tab = document.createElement('div');
    tab.id = 'task-manager-tab';
    tab.title = 'Show/Hide Task Manager';
    tab.innerHTML = '<span style="font-size: 1.5rem;">🗂️</span>';
    document.body.appendChild(tab);

    // Sidebar open/close logic
    let sidebarOpen = false;
    function openSidebar() {
        sidebar.classList.add('open');
        sidebar.appendChild(tab);
        sidebarOpen = true;
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        document.body.appendChild(tab);
        sidebarOpen = false;
    }
    tab.addEventListener('click', () => {
        if (sidebarOpen) {
            closeSidebar();
        } else {
            openSidebar();
            renderTaskManagerSidebar();
        }
    });

    // Render the task manager UI into the sidebar
    function renderTaskManagerSidebar() {
        try {
            // Render main sidebar content first
            document.getElementById('task-sidebar-content').innerHTML = `
                <div class="panel panel-tasks">
                    <header class="panel-header" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5em; position:relative; z-index:10;">
                        <span class="panel-title">Tasks</span>
                    </header>
                    <div class="weekly-summary" id="weekly-summary">
                        <span id="weekly-progress-label">Weekly Progress:</span>
                        <div class="summary-bar"><div class="summary-bar-inner" id="summary-bar-inner" style="width:0%"></div></div>
                    </div>
                    <div class="quick-add-bar">
                        <input type="text" id="quick-add-input" placeholder="Quick Add: e.g. Meeting at 3pm tomorrow">
                        <button id="quick-add-btn" title="Add Task" class="primary">➕</button>
                    </div>
                    <div class="task-controls">
                        <input type="text" id="search-tasks" placeholder="Search tasks...">
                        <button id="toggle-completed" title="Show/Hide Completed Tasks">✔️</button>
                    </div>
                    <ul class="task-list" id="task-list"></ul>
                </div>
            `;

            // Create or get existing modal
            let modal = document.getElementById('task-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'task-modal';
                modal.className = 'modal';
                modal.style.display = 'none';
                modal.innerHTML = `
                    <form id="task-form" class="task-form">
                        <h2 id="modal-title">Add Task</h2>
                        <input type="text" id="task-title" placeholder="Task title" required />
                        <input type="date" id="task-date" />
                        <input type="time" id="task-time" />
                        <input type="text" id="task-location" placeholder="Location (optional)" />
                        <label><input type="checkbox" id="task-reminder" /> Reminder</label>
                        <div class="modal-actions">
                            <button type="submit" id="save-task-btn">💾 Save</button>
                            <button type="button" id="delete-task-btn" style="display:none;">🗑️ Delete</button>
                            <button type="button" id="close-modal">Cancel</button>
                        </div>
                    </form>
                `;
                document.getElementById('task-manager-sidebar').appendChild(modal);
            }

            // Import sidebar.js after DOM elements are created
            import(chrome.runtime.getURL('sidebar.js'))
                .then(mod => {
                    if (mod && typeof mod.initTaskManager === 'function') {
                        mod.initTaskManager({
                            modalContainer: modal,
                            context: 'sidebar'
                        });
                    }
                })
                .catch(error => {
                    if (error.message.includes('Extension context invalidated')) {
                        console.log('[TaskManager] Extension reloaded, please refresh the page');
                        document.getElementById('task-sidebar-content').innerHTML = `
                            <div class="error-message" style="padding: 1em; color: #dc143c;">
                                Extension has been updated. Please refresh the page to continue.
                            </div>
                        `;
                    } else {
                        console.error('[TaskManager] Error loading sidebar:', error);
                    }
                });

        } catch (err) {
            console.error('[TaskManager] Error in renderTaskManagerSidebar:', err);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();
