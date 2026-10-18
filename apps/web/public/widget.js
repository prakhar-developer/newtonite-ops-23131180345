(function(){"use strict";(function(){const n=document.currentScript,b=(n==null?void 0:n.getAttribute("data-api-url"))||window.instOS_API_URL||"http://localhost:4000/api/v1",g=(n==null?void 0:n.getAttribute("data-team"))||"support",f=document.createElement("style");f.textContent=`
    .instos-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .instos-widget-btn:hover {
      transform: scale(1.08);
      background: #4f46e5;
    }
    .instos-widget-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 48px);
      height: 580px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(226, 232, 240, 0.8);
      z-index: 999998;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: instos-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes instos-slide-up {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .instos-header {
      background: #0f172a;
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .instos-tabs {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .instos-tab-btn {
      flex: 1;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 500;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;
    }
    .instos-tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .instos-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    .instos-field {
      margin-bottom: 14px;
    }
    .instos-field label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 4px;
    }
    .instos-input, .instos-select, .instos-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      color: #0f172a;
      outline: none;
      transition: border-color 0.15s;
    }
    .instos-input:focus, .instos-textarea:focus {
      border-color: #4f46e5;
    }
    .instos-submit {
      width: 100%;
      background: #4f46e5;
      color: #ffffff;
      padding: 11px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
  `,document.head.appendChild(f);const l=document.createElement("button");l.className="instos-widget-btn",l.innerHTML=`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;const t=document.createElement("div");t.className="instos-widget-panel",t.innerHTML=`
    <div class="instos-header">
      <div>
        <div style="font-weight: 600; font-size: 14px;">Operational Support</div>
        <div style="font-size: 11px; color: #94a3b8;">instOS Ingestion Engine</div>
      </div>
      <button id="instos-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div class="instos-tabs">
      <button class="instos-tab-btn active" id="instos-tab-raise">New Request</button>
      <button class="instos-tab-btn" id="instos-tab-track">Track Request</button>
    </div>
    <div class="instos-content" id="instos-raise-view">
      <form id="instos-form">
        <div class="instos-field">
          <label>Your Name *</label>
          <input type="text" class="instos-input" id="instos-name" required placeholder="Jane Doe" />
        </div>
        <div class="instos-field">
          <label>Work Email *</label>
          <input type="email" class="instos-input" id="instos-email" required placeholder="jane@company.com" />
        </div>
        <div class="instos-field">
          <label>Request Category *</label>
          <select class="instos-select" id="instos-category">
            <option value="CUSTOMER_ISSUE">General Support</option>
            <option value="PAYMENT">Payment / Invoice Dispute</option>
            <option value="INCIDENT">System Outage / Urgent Bug</option>
            <option value="COMPLIANCE">Compliance / Document Flag</option>
          </select>
        </div>
        <div class="instos-field">
          <label>Priority</label>
          <select class="instos-select" id="instos-priority">
            <option value="MEDIUM">Medium (Normal)</option>
            <option value="HIGH">High (Impacts business)</option>
            <option value="CRITICAL">Critical (Total blocker)</option>
          </select>
        </div>
        <div class="instos-field">
          <label>Subject *</label>
          <input type="text" class="instos-input" id="instos-title" required placeholder="Summary of issue" />
        </div>
        <div class="instos-field">
          <label>Description Details *</label>
          <textarea class="instos-textarea" id="instos-desc" rows="3" required placeholder="What happened? Steps to reproduce..."></textarea>
        </div>
        <button type="submit" class="instos-submit" id="instos-submit-btn">Submit Request</button>
      </form>
      <div id="instos-success" style="display: none; text-align: center; padding: 24px 0;">
        <div style="font-size: 36px; margin-bottom: 8px;">✅</div>
        <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">Ticket Created!</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 16px;" id="instos-ticket-info"></div>
        <button class="instos-submit" id="instos-track-now" style="background: #0f172a;">Track Status</button>
      </div>
    </div>
    <div class="instos-content" id="instos-track-view" style="display: none;">
      <div class="instos-field">
        <label>Enter Ticket Token / PIN</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" class="instos-input" id="instos-token-input" placeholder="e.g. 550e8400-e29b-..." />
          <button class="instos-submit" id="instos-search-token" style="width: auto; padding: 0 16px;">Find</button>
        </div>
      </div>
      <div id="instos-track-result" style="display: none; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: #f8fafc;">
        <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;" id="instos-track-title"></div>
        <div style="display: flex; gap: 6px; margin-bottom: 12px;">
          <span id="instos-track-status" style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #e0e7ff; color: #4338ca;"></span>
          <span id="instos-track-priority" style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #475569;"></span>
        </div>
        <a id="instos-track-link" target="_blank" style="font-size: 12px; color: #4f46e5; text-decoration: none; font-weight: 600;">Open in Full Portal &rarr;</a>
      </div>
    </div>
  `,document.body.appendChild(l),document.body.appendChild(t),l.addEventListener("click",()=>{t.style.display=t.style.display==="flex"?"none":"flex"}),t.querySelector("#instos-close").addEventListener("click",()=>{t.style.display="none"});const d=t.querySelector("#instos-tab-raise"),p=t.querySelector("#instos-tab-track"),y=t.querySelector("#instos-raise-view"),x=t.querySelector("#instos-track-view");d.addEventListener("click",()=>{d.classList.add("active"),p.classList.remove("active"),y.style.display="block",x.style.display="none"}),p.addEventListener("click",()=>{p.classList.add("active"),d.classList.remove("active"),y.style.display="none",x.style.display="block"});const m=t.querySelector("#instos-form");m.addEventListener("submit",async c=>{var i;c.preventDefault();const o=t.querySelector("#instos-submit-btn");o.disabled=!0,o.textContent="Submitting...";const a={name:t.querySelector("#instos-name").value,email:t.querySelector("#instos-email").value,category:t.querySelector("#instos-category").value,priority:t.querySelector("#instos-priority").value,title:t.querySelector("#instos-title").value,description:t.querySelector("#instos-desc").value,channel:"WIDGET",teamSlug:g};try{const e=await fetch(`${b}/tickets`,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":`widget-${Date.now()}-${Math.random().toString(36).slice(2)}`},body:JSON.stringify(a)}),s=await e.json();if(!e.ok)throw new Error(((i=s==null?void 0:s.error)==null?void 0:i.message)||"Submission failed");m.style.display="none";const u=t.querySelector("#instos-success");u.style.display="block";const v=t.querySelector("#instos-ticket-info");v.innerHTML=`Ticket <strong>#${s.data.ticketNumber}</strong> created.<br>Tracking token: <code>${s.data.trackingToken}</code>`;const k=t.querySelector("#instos-track-now");k.onclick=()=>{window.open(`http://localhost:5173/portal/track/${s.data.trackingToken}`,"_blank")}}catch(e){alert(`Error submitting request: ${e.message}`)}finally{o.disabled=!1,o.textContent="Submit Request"}});const r=t.querySelector("#instos-search-token");r.addEventListener("click",async()=>{var o;const c=t.querySelector("#instos-token-input").value.trim();if(c){r.disabled=!0,r.textContent="...";try{const a=await fetch(`${b}/tickets/track/${c}`),i=await a.json();if(!a.ok)throw new Error(((o=i==null?void 0:i.error)==null?void 0:o.message)||"Not found");const e=i.data,s=t.querySelector("#instos-track-result");s.style.display="block",t.querySelector("#instos-track-title").textContent=`#${e.ticketNumber} ${e.title}`,t.querySelector("#instos-track-status").textContent=e.status,t.querySelector("#instos-track-priority").textContent=e.priority;const u=t.querySelector("#instos-track-link");u.href=`http://localhost:5173/portal/track/${e.trackingToken}`}catch(a){alert(`Error finding ticket: ${a.message}`)}finally{r.disabled=!1,r.textContent="Find"}}})})()})();
