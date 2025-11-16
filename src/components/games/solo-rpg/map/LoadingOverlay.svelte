<script lang="ts">
  export let done = 0;
  export let total = 0;
</script>

<div class="loading-overlay" aria-busy="true">
  <div class="loading-box">
    <div class="spinner"></div>
    <div class="loading-text">Loading tiles… {done}/{total}</div>
    <div class="loading-bar"><div class="fill" style="width: {total ? (done/total*100) : 0}%"></div></div>
    <div class="loading-note">Large maps may take a moment.</div>
  </div>
</div>

<style>
  .loading-overlay {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(17,17,17,0.6); backdrop-filter: blur(2px);
    pointer-events: all; /* block interactions while loading */
  }
  .loading-box { background: rgba(0,0,0,0.7); color: #fff; padding: 16px 20px; border-radius: 8px; min-width: 240px; text-align: center; }
  .spinner { width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; margin: 0 auto 10px; animation: spin 1s linear infinite; }
  .loading-text { font-size: 14px; margin-bottom: 8px; }
  .loading-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
  .loading-bar .fill { height: 100%; background: #4aa3ff; width: 0%; transition: width 0.2s ease; }
  .loading-note { font-size: 12px; opacity: 0.8; margin-top: 8px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
