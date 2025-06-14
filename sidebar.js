// Sidebar.js - Persistent task storage with chrome.storage.sync

function isChromeStorageAvailable() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;
}

// Track notified overdue tasks to avoid duplicate notifications
const notifiedOverdueTasks = new Set(JSON.parse(localStorage.getItem('notifiedOverdueTasks') || '[]'));

export function initTaskManager({ modalContainer, context } = {}) {
    if (context !== 'popup' && context !== 'sidebar') return;

    const taskList = document.getElementById('task-list');
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const taskForm = document.getElementById('task-form');
    const titleInput = document.getElementById('task-title');
    const dateInput = document.getElementById('task-date');
    const timeInput = document.getElementById('task-time');
    const locationInput = document.getElementById('task-location');
    const reminderInput = document.getElementById('task-reminder');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const quickAddInput = document.getElementById('quick-add-input');
    const quickAddBtn = document.getElementById('quick-add-btn');
    const searchTasksInput = document.getElementById('search-tasks');
    const weeklySummary = document.getElementById('weekly-summary');
    const summaryBarInner = document.getElementById('summary-bar-inner');
    const toggleCompletedBtn = document.getElementById('toggle-completed');
    let editingTaskIdx = null;
    let tasks = [];
    let showCompleted = true;

    if (searchTasksInput) searchTasksInput.placeholder = '🔍 Search';
    quickAddInput.placeholder = '⚡ Task';

    quickAddBtn.addEventListener('click', () => {
        openModal(null, { title: quickAddInput.value.trim() });
        quickAddInput.value = '';
    });

    let clearCompletedBtn = document.createElement('button');
    clearCompletedBtn.textContent = 'Clear';
    clearCompletedBtn.id = 'clear-completed-btn';
    Object.assign(clearCompletedBtn.style, {
        display: 'none',
        margin: '0.5em 0',
        background: '#e74c3c',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '6px 14px',
        cursor: 'pointer',
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => !t.completed);
        saveTasksToStorage();
        renderTaskList();
        updateWeeklySummary();
    });



    toggleCompletedBtn.addEventListener('click', () => {
        showCompleted = !showCompleted;
        toggleCompletedBtn.classList.toggle('active', showCompleted);
        toggleCompletedBtn.blur();
        renderTaskList();
        updateWeeklySummary();
    });

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'flex' && e.key === 'Escape') closeModal();
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const dateValue = dateInput.value;
        const timeValue = timeInput.value;
        
        const validation = validateDateTime(dateValue, timeValue);
        if (!validation.valid) {
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.color = '#dc143c';
            errorDiv.style.marginBottom = '1em';
            errorDiv.textContent = validation.message;
            
            // Remove any existing error message
            const existingError = taskForm.querySelector('.form-error');
            if (existingError) existingError.remove();
            
            // Insert error before the save button
            saveTaskBtn.parentNode.insertBefore(errorDiv, saveTaskBtn);
            return;
        }
        
        const taskObj = {
            title: titleInput.value.trim(),
            date: dateInput.value,
            time: timeInput.value,
            location: locationInput.value.trim(),
            reminder: reminderInput.checked,
            completed: editingTaskIdx !== null ? tasks[editingTaskIdx].completed : false,
        };
        if (!taskObj.title) return;
        if (editingTaskIdx !== null) {
            tasks[editingTaskIdx] = taskObj;
            scheduleNotification(taskObj, editingTaskIdx);
        } else {
            tasks.push(taskObj);
            scheduleNotification(taskObj, tasks.length - 1);
        }
        saveTasksToStorage();
        updateWeeklySummary();
        renderTaskList();
        closeModal();
    });

    deleteTaskBtn.addEventListener('click', () => {
        if (editingTaskIdx !== null) {
            tasks.splice(editingTaskIdx, 1);
            saveTasksToStorage();
            renderTaskList();
            updateWeeklySummary();
            closeModal();
        }
    });

    searchTasksInput.addEventListener('input', (e) => {
        filterTasks(e.target.value);
    });

    function openModal(editIdx = null, prefill = {}) {
        modal.style.display = 'flex';
        if (editIdx !== null) {
            modalTitle.textContent = 'Edit Task';
            const t = tasks[editIdx];
            titleInput.value = t.title || '';
            dateInput.value = t.date || '';
            timeInput.value = t.time || '';
            locationInput.value = t.location || '';
            reminderInput.checked = !!t.reminder;
            deleteTaskBtn.style.display = '';
            editingTaskIdx = editIdx;
        } else {
            modalTitle.textContent = 'Add Task';
            taskForm.reset();
            titleInput.value = prefill.title || '';
            dateInput.value = prefill.date || '';
            timeInput.value = prefill.time || '';
            locationInput.value = prefill.location || '';
            reminderInput.checked = !!prefill.reminder;
            deleteTaskBtn.style.display = 'none';
            editingTaskIdx = null;
        }
        titleInput.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function renderTaskList() {
        taskList.innerHTML = '';
        // After rendering tasks, append the clear button below the task list
        if (taskList.parentNode && !taskList.parentNode.contains(clearCompletedBtn)) {
            taskList.parentNode.appendChild(clearCompletedBtn);
        }
        if (showCompleted && tasks.some(t => t.completed)) {
            clearCompletedBtn.style.display = '';
        } else {
            clearCompletedBtn.style.display = 'none';
        }

        const now = new Date();
        const filteredTasks = getFilteredTasks();
        filteredTasks.forEach((task, idx) => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.completed ? ' completed' : '');
            li.draggable = true;

            let notes = '';
            const parts = [];
            if (task.date || task.time) {
                parts.push([task.date, task.time].filter(Boolean).join(' '));
            }
            if (task.location) {
                parts.push(task.location);
            }
            if (parts.length) {
                notes = `<div class="task-notes">${parts.join(' · ')}</div>`;
            }

            li.innerHTML = `
                <input type="checkbox" class="complete-task-checkbox" ${task.completed ? 'checked' : ''} title="Mark as completed" />
                <span class="task-title" style="cursor:pointer;">${task.title}</span>
                ${notes}
                <button class="edit-task-btn">✏️</button>
                <button class="delete-task-btn">🗑️</button>
            `;

            // Show full text in a speech bubble overlay on click
            li.querySelector('.task-title').addEventListener('click', (event) => {
                // Remove existing bubble if any
                let existing = document.querySelector('#task-manager-sidebar .speech-bubble');
                if (existing) existing.remove();

                // Create speech bubble
                const bubble = document.createElement('div');
                bubble.className = 'speech-bubble';
                let dueInfo = '';
                if (task.date || task.time) {
                    dueInfo = `<div class='bubble-due'><strong>Due:</strong> ${[task.date, task.time].filter(Boolean).join(' ')}</div>`;
                }
                bubble.innerHTML = `<div class="bubble-title">Full Task</div>${dueInfo}<div class="bubble-info">${task.title}</div>`;
                
                const sidebar = document.getElementById('task-manager-sidebar');
                sidebar.appendChild(bubble);

                // Get dimensions
                const sidebarRect = sidebar.getBoundingClientRect();
                const targetRect = event.target.getBoundingClientRect();
                const bubbleRect = bubble.getBoundingClientRect();

                // Calculate initial position
                let topPosition = targetRect.top - sidebarRect.top - bubbleRect.height - 10;
                let leftPosition = targetRect.left - sidebarRect.left - bubbleRect.width/2 + targetRect.width/2;

                // Constrain positions within sidebar
                if (topPosition < 0) {
                    // Position below if not enough space above
                    topPosition = targetRect.top - sidebarRect.top + targetRect.height + 10;
                    bubble.classList.add('below');
                }

                // Constrain horizontal position
                leftPosition = Math.max(10, Math.min(leftPosition, sidebarRect.width - bubbleRect.width - 10));

                // Apply constrained positions
                bubble.style.top = `${topPosition}px`;
                bubble.style.left = `${leftPosition}px`;

                // Remove bubble on click outside or after 6 seconds
                const removeBubble = (e) => {
                    if (!bubble.contains(e.target)) {
                        bubble.remove();
                        document.removeEventListener('mousedown', removeBubble);
                    }
                };
                document.addEventListener('mousedown', removeBubble);
                
                // Auto-remove after 6 seconds
                setTimeout(() => {
                    if (bubble.parentNode) {
                        bubble.remove();
                        document.removeEventListener('mousedown', removeBubble);
                    }
                }, 6000);
            });


            li.querySelector('.complete-task-checkbox').addEventListener('change', (e) => {
                task.completed = e.target.checked;
                saveTasksToStorage();
                renderTaskList();
                updateWeeklySummary();
            });

            li.querySelector('.edit-task-btn').addEventListener('click', () => openModal(idx));

            li.querySelector('.delete-task-btn').addEventListener('click', () => {
                tasks.splice(idx, 1);
                saveTasksToStorage();
                renderTaskList();
                updateWeeklySummary();
            });

            li.addEventListener('dragstart', (e) => {
                li.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', idx);
            });
            li.addEventListener('dragend', () => li.classList.remove('dragging'));
            li.addEventListener('dragover', (e) => e.preventDefault());
            li.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                if (fromIdx !== idx) {
                    const moved = tasks.splice(fromIdx, 1)[0];
                    tasks.splice(idx, 0, moved);
                    saveTasksToStorage();
                    renderTaskList();
                }
            });

            const titleSpan = li.querySelector('.task-title');
            if (!task.completed && task.date) {
                const dueDate = new Date(task.date + 'T' + (task.time || '00:00'));
                if (dueDate < now) {
                    titleSpan.classList.add('task-overdue');
                    const key = task.title + task.date + task.time;
                    if (!notifiedOverdueTasks.has(key)) {
                        if (Notification.permission === 'granted') {
                            new Notification('Task Overdue', { body: `${task.title} is overdue!` });
                        }
                        notifiedOverdueTasks.add(key);
                        localStorage.setItem('notifiedOverdueTasks', JSON.stringify([...notifiedOverdueTasks]));
                    }
                }
            }

            taskList.appendChild(li);
        });
    }

    function getFilteredTasks() {
        const query = searchTasksInput.value.trim().toLowerCase();
        return tasks.filter(t => {
            const matches = t.title.toLowerCase().includes(query);
            return (showCompleted || !t.completed) && matches;
        });
    }

    function filterTasks(query) {
        renderTaskList();
        updateWeeklySummary();
    }

    function updateWeeklySummary() {
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        // Create or update weekly summary container
        let weeklySum = document.getElementById('weekly-summary');
        if (!weeklySum) {
            weeklySum = document.createElement('div');
            weeklySum.id = 'weekly-summary';
            document.querySelector('#task-manager-sidebar').appendChild(weeklySum);
        }
        
        weeklySum.innerHTML = `
            <div id="weekly-progress-label">
                Weekly Progress: ${completed} / ${total} tasks (${percentage}%)
            </div>
            <div class="progress-bar">
                <div id="summary-bar-inner"></div>
            </div>
        `;
        
        // Update progress bar
        const barInner = weeklySum.querySelector('#summary-bar-inner');
        requestAnimationFrame(() => {
            barInner.style.width = `${percentage}%`;
        });

        // Update dark mode if needed
        if (isDarkMode()) {
            weeklySum.classList.add('dark');
        } else {
            weeklySum.classList.remove('dark');
        }
    }

    function saveTasksToStorage() {
        if (isChromeStorageAvailable()) {
            chrome.storage.sync.set({ tasks });
        } else {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }

    function loadTasksFromStorage(cb) {
        if (isChromeStorageAvailable()) {
            chrome.storage.sync.get(['tasks'], (result) => {
                tasks = Array.isArray(result.tasks) ? result.tasks : [];
                cb(tasks);
            });
        } else {
            const stored = localStorage.getItem('tasks');
            tasks = stored ? JSON.parse(stored) : [];
            cb(tasks);
        }
    }

    function scheduleNotification(task, idx) {
        if (!task.reminder || !task.date || !task.time) return;
        const dtStr = `${task.date}T${task.time}`;
        const taskTime = new Date(dtStr).getTime();
        const now = Date.now();
        if (taskTime > now) {
            setTimeout(() => {
                if (Notification.permission === 'granted') {
                    new Notification('Task Reminder', {
                        body: `${task.title}${task.location ? ' @ ' + task.location : ''}`,
                    });
                }
            }, taskTime - now);
        }
    }

    async function requestNotificationPermission() {
        // Check if we already have notification permission
        if (Notification.permission === "granted") {
            return true;
        }
        
        // Create notification request dialog
        const dialog = document.createElement('div');
        dialog.className = 'notification-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f0f8ff;
            padding: 20px;
            border: 2px solid #4682b4;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 10000;
            width: 300px;
            text-align: center;
        `;
        
        dialog.innerHTML = `
            <h3 style="color: #2c3e50; margin-bottom: 1em;">Enable Reminders</h3>
            <p style="margin-bottom: 1.5em;">Allow notifications to receive task reminders from Schedule Sidebar Extension</p>
            <button id="allow-notifications" style="background: #4682b4; color: white; border: none; padding: 8px 16px; margin-right: 10px; border-radius: 4px;">Allow</button>
            <button id="deny-notifications" style="background: #dc143c; color: white; border: none; padding: 8px 16px; border-radius: 4px;">Don't Allow</button>
        `;
        
        document.body.appendChild(dialog);
        
        return new Promise((resolve) => {
            document.getElementById('allow-notifications').onclick = async () => {
                const permission = await Notification.requestPermission();
                dialog.remove();
                resolve(permission === "granted");
            };
            
            document.getElementById('deny-notifications').onclick = () => {
                dialog.remove();
                resolve(false);
            };
        });
    }

    // Call this when setting a reminder
    async function setReminder(task) {
        if (task.reminder) {
            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) {
                alert('Reminders will not be sent because notifications are disabled.');
            }
        }
        // ...existing reminder code...
    }

    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    loadTasksFromStorage(ts => {
        tasks = ts.map(t => ({ ...t, completed: !!t.completed }));
        renderTaskList();
        updateWeeklySummary();
        tasks.forEach((task, idx) => scheduleNotification(task, idx));
    });

    function updateTaskStatus(taskElement, taskDate, taskTime) {
        const now = new Date();
        const taskDateTime = new Date(taskDate);
        
        if (taskTime) {
            const [hours, minutes] = taskTime.split(':');
            taskDateTime.setHours(parseInt(hours), parseInt(minutes));
        }

        const titleElement = taskElement.querySelector('.task-title');
        
        if (taskDateTime < now && !taskElement.classList.contains('completed')) {
            titleElement.style.color = '#dc143c';  // Crimson for overdue
        } else {
            titleElement.style.color = '#32CD32';  // LimeGreen for future/completed
        }
    }

    function validateDateTime(date, time) {
        const now = new Date();
        const selectedDate = new Date(date);
        
        if (time) {
            const [hours, minutes] = time.split(':');
            selectedDate.setHours(parseInt(hours), parseInt(minutes));
        }
        
        return {
            valid: true,
            isOverdue: selectedDate < now
        };
    }
}


function isDarkMode() {
    // Check if user's system is in dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Check if the host website has dark mode class/attribute
    const hostIsDark = document.documentElement.classList.contains('dark') || 
                      document.body.classList.contains('dark');
    
    return prefersDark || hostIsDark;
}

// Listen for system dark mode changes
window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
    const isDark = e.matches;
    const sidebar = document.getElementById('task-manager-sidebar');
    if (isDark) {
        sidebar.classList.add('dark');
        document.body.classList.add('dark');
    } else {
        sidebar.classList.remove('dark');
        document.body.classList.remove('dark');
    }
    updateWeeklySummary();
});
