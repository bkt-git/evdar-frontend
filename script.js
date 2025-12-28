// 🔒 prevent double execution
if (window.__dashboardLoaded) {
    console.warn("Dashboard script already loaded");
} else {
    window.__dashboardLoaded = true;

    document.addEventListener("DOMContentLoaded", () => {
        // Delay prevents Live Server race condition
        setTimeout(initDashboard, 100);
    });
}

function initDashboard() {
    const raw = localStorage.getItem("user");

    if (!raw) {
        safeRedirect();
        return;
    }

    let user;
    try {
        user = JSON.parse(raw);
    } catch (e) {
        console.error("Invalid JSON in storage", e);
        safeRedirect();
        return;
    }

    if (!user.username || !user.role) {
        safeRedirect();
        return;
    }

    // ---- UI BINDING ----
    const welcomeEl = document.getElementById("welcome");
    if (welcomeEl) welcomeEl.innerText = `Welcome ${user.username} (${user.role})`;

    const userIdEl = document.getElementById("userId");
    if (userIdEl) userIdEl.innerText = user.user_id ?? "N/A";

    const select = document.getElementById("clientSelect");
    if (select) {
        select.innerHTML = "";

        if (user.role === "admin") {
            ["car1", "car2", "car3"].forEach(c => {
                const o = document.createElement("option");
                o.value = c;
                o.textContent = c;
                select.appendChild(o);
            });
        } else {
            const o = document.createElement("option");
            o.value = user.car;
            o.textContent = user.car;
            select.appendChild(o);
        }
    }

    console.log("Dashboard ready", user);
    // expose current user for other scripts
    window.__evdarUser = user;

    // render default view
    // show admin link only for admins
    const adminLink = document.querySelector('.admin-link');
    if (adminLink) adminLink.style.display = (user.role === 'admin') ? 'block' : 'none';

    // if (window.renderView) window.renderView('overview');

    // --- COSMIC THEME INIT ---
    // Create a fixed background layer for stars so they don't scroll away
    let bgLayer = document.getElementById('cosmic-bg');
    if (!bgLayer) {
        bgLayer = document.createElement('div');
        bgLayer.id = 'cosmic-bg';
        bgLayer.style.position = 'fixed';
        bgLayer.style.top = '0';
        bgLayer.style.left = '0';
        bgLayer.style.width = '100%';
        bgLayer.style.height = '100%';
        bgLayer.style.zIndex = '0';
        bgLayer.style.pointerEvents = 'none';
        bgLayer.style.overflow = 'hidden';
        document.body.prepend(bgLayer);

        // Aurora
        const aurora = document.createElement("div");
        aurora.classList.add("aurora");
        bgLayer.appendChild(aurora);

        // Stars
        for (let i = 0; i < 150; i++) {
            const star = document.createElement("div");
            star.classList.add("star");
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 5;
            const size = Math.random() * 2 + 1;

            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.setProperty('--duration', `${duration}s`);
            star.style.setProperty('--delay', `${delay}s`);
            bgLayer.appendChild(star);
        }

        // Shooting Stars
        function spawnShootingStar() {
            const shoot = document.createElement("div");
            shoot.classList.add("shooting-star");
            shoot.style.top = `${Math.random() * 50 - 20}%`;
            shoot.style.left = `${Math.random() * 50 + 50}%`;
            shoot.style.animationDuration = `${Math.random() * 1 + 1}s`;
            bgLayer.appendChild(shoot);
            setTimeout(() => shoot.remove(), 3000);
        }
        setInterval(spawnShootingStar, 5000);
        spawnShootingStar();
    }
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

function safeRedirect() {
    console.warn("Redirecting due to missing session");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 200);
}

// render content into the main area based on sidebar selection
// modified renderView to support Toggle approach
window.renderView = function (view) {
    const overview = document.getElementById('view-overview');
    const generic = document.getElementById('view-generic');

    // Manage Sidebar active states
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    // Try to find the link that called this (heuristically, or just skip visual active state for now)

    // TOGGLE LOGIC
    if (view === 'overview') {
        if (overview) overview.style.display = 'block';
        if (generic) generic.style.display = 'none';

        // Refresh chart if needed? usually not needed since we just hid it.
        return;
    }

    // For all other views, hide overview, show generic
    if (overview) overview.style.display = 'none';
    if (generic) {
        generic.style.display = 'block';
        generic.innerHTML = ''; // clear previous
    } else {
        return; // safeguard
    }

    // --- GENERIC VIEWS CONTENT ---

    const raw = localStorage.getItem('user');
    let user = null;
    try { user = raw ? JSON.parse(raw) : null; } catch (e) { user = null; }

    if (view === 'vehicle') {
        generic.innerHTML = `<div id="mapholder" style="height: calc(100vh - 140px); width: 100%; border-radius: 12px; background: rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#64748b;">Map Holder</div>`;
        return;
    }

    if (view === 'admin') {
        if (!user || user.role !== 'admin') {
            generic.innerHTML = `
                <div class="card" style="text-align:center; padding: 40px;">
                    <h2 style="color:#ef4444">Access Denied</h2>
                    <p>This area is restricted to administrators.</p>
                </div>`;
            return;
        }

        generic.innerHTML = `
          <div class="card" style="margin-bottom: 20px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                      <h2>Admin Console</h2>
                      <p style="opacity:0.7; margin-top:4px;">Manage system users and data</p>
                  </div>
                  <button id="btnReloadUsers" style="width:auto; padding: 10px 20px;">↻ Refresh List</button>
              </div>
          </div>

          <div class="dashboard-grid">
              
              <!-- User List -->
              <div class="card">
                  <h3>Users Database</h3>
                  <div id="adminOutput" style="margin-top:15px; overflow-x:auto;">
                      <p style="opacity:0.7; font-style:italic;">Click refresh to load users...</p>
                  </div>
              </div>

              <!-- Add User Form -->
              <div class="card">
                  <h3>Add New User</h3>
                  <form id="adminAddUserForm" style="display:flex; flex-direction:column; gap:15px; margin-top:15px;">
                      
                      <div class="form-group">
                          <label>Username</label>
                          <input name="username" required placeholder="e.g. driver1">
                      </div>

                      <div class="form-group">
                          <label>Password</label>
                          <input name="password" type="password" required placeholder="••••••••">
                      </div>

                          <div class="form-group">
                              <label>Role</label>
                              <select name="role" style="width:100%">
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                              </select>
                          </div>

                      <button type="submit" style="margin-top:10px;">Create User</button>
                  </form>
                  <div id="adminAddOutput" style="margin-top:15px;"></div>
              </div>

          </div>
        `;

        // ... functionality binding for admin ...
        const btn = document.getElementById('btnReloadUsers');
        const out = document.getElementById('adminOutput');

        // Load on mount automatically? optional.

        if (btn) {
            btn.addEventListener('click', async () => {
                out.innerHTML = '<p style="color:#3b82f6">Loading...</p>';
                try {
                    const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') && location.port === '5500'
                        ? 'http://127.0.0.1:5000' : '';
                    const res = await fetch(API_BASE + '/users');
                    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
                    const users = await res.json();

                    if (!Array.isArray(users) || users.length === 0) {
                        out.innerHTML = '<p>No users found.</p>';
                    } else {
                        // Render Styled Table
                        let html = '<table>';
                        html += '<thead><tr>';
                        // columns: user_id, username, role, car, Action
                        html += '<th>ID</th><th>Username</th><th>Role</th><th>Car</th><th>Action</th>';
                        html += '</tr></thead><tbody>';

                        users.forEach(u => {
                            html += '<tr>';
                            html += `<td>${u.user_id || u.id || '-'}</td>`;
                            html += `<td>${u.username}</td>`;
                            html += `<td>${u.role}</td>`;
                            html += `<td>${u.car || '-'}</td>`;

                            // Prevent deleting self (current admin) could be nice, but for now just simple delete
                            const uid = u.user_id || u.id;
                            html += `<td style="text-align:center;">
                                <button onclick="deleteUser('${uid}')" style="background:#fee2e2; color:#b91c1c; border:none; padding:4px 8px; font-size:12px; border-radius:4px; cursor:pointer;" title="Delete User">🗑️</button>
                            </td>`;
                            html += '</tr>';
                        });
                        html += '</tbody></table>';
                        out.innerHTML = html;
                    }
                } catch (err) {
                    out.innerHTML = `<p style="color:#ef4444">Error: ${err.message}</p>`;
                }
            });
        }


        const addForm = document.getElementById('adminAddUserForm');
        const addOutput = document.getElementById('adminAddOutput');
        if (addForm) {
            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = new FormData(addForm);
                const role = form.get('role');
                const username = form.get('username');

                const btn = addForm.querySelector('button');
                const originalText = btn.innerText;
                btn.disabled = true;
                btn.innerText = 'Creating...';
                addOutput.innerHTML = '';

                try {
                    const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') && location.port === '5500'
                        ? 'http://127.0.0.1:5000' : '';

                    // 1. Fetch current users to determine next ID
                    const usersRes = await fetch(API_BASE + '/users');
                    if (!usersRes.ok) throw new Error('Could not fetch users to assign ID');
                    const users = await usersRes.json();

                    // Simple logic: find max id (assuming they have 'user_id' or 'id')
                    // We'll try user_id first
                    let maxId = 0;
                    if (Array.isArray(users)) {
                        users.forEach(u => {
                            const uid = parseInt(u.user_id || u.id || 0);
                            if (uid > maxId) maxId = uid;
                        });
                    }
                    const nextId = maxId + 1;

                    // 2. Auto-Assign Car
                    let assignedCar = "";
                    if (role === 'user') {
                        assignedCar = `car${nextId}.csv`;
                    }

                    const payload = {
                        username: username,
                        password: form.get('password'),
                        role: role,
                        car: assignedCar // Auto-assigned
                    };

                    const res = await fetch(API_BASE + '/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Create failed');

                    let successMsg = `Success! User <strong>${payload.username}</strong> created.`;
                    if (role === 'user') {
                        successMsg += ` Auto-assigned <strong>${assignedCar}</strong>.`;
                    }

                    addOutput.innerHTML = `<div style="padding:10px; background:#dcfce7; color:#166534; border-radius:6px;">${successMsg}</div>`;
                    addForm.reset();
                } catch (err) {
                    addOutput.innerHTML = `<div style="padding:10px; background:#fee2e2; color:#991b1b; border-radius:6px;">Error: ${err.message}</div>`;
                } finally {
                    btn.disabled = false;
                    btn.innerText = originalText;
                }
            });
        }
        return;
    }

    if (view === 'help') {
        generic.innerHTML = `<h2>Help</h2><p>For assistance, contact support.</p>`;
        return;
    }
    if (view === 'contact') {
        generic.innerHTML = `<h2>Contact Us</h2><p>Email: support@EVDAR.example</p>`;
        return;
    }
    if (view === 'about') {
        generic.innerHTML = `<h2>About</h2><p>EVDAR — vehicle telemetry dashboard</p>`;
        return;
    }

    generic.innerHTML = `<p>Unknown view: ${view}</p>`;
}

// Global Delete User Function
window.deleteUser = async function (userId) {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) return;

    try {
        const API_BASE = 'https://untempting-untemperamentally-renata.ngrok-free.dev';

        const res = await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Delete failed');
        }

        alert('User deleted.');
        // If we are on admin view, refresh list
        const btn = document.getElementById('btnReloadUsers');
        if (btn) btn.click();

    } catch (err) {
        alert('Error: ' + err.message);
    }
};