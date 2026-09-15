export function createDetailRecovery({ deadline, onPause, onResume, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  const delays = [15, 30, 60].map(minutes => minutes * 60000);
  let missing = 0;
  let attempts = 0;
  return async operation => {
    for (;;) {
      try { const result = await operation(); missing = 0; return result; }
      catch (error) {
        if (error.code !== 'VEHICLE_IDENTITY_MISMATCH' || error.receivedStock !== 'Not listed') { missing = 0; throw error; }
        missing++;
        if (missing < 3) throw error;
        const delay = delays[attempts];
        if (delay == null || now() + delay + 30000 >= deadline) {
          const exhausted = new Error('Detail content remains unavailable; automatic recovery stopped and validated vehicles will be uploaded.');
          exhausted.code = 'DETAIL_RECOVERY_EXHAUSTED';
          throw exhausted;
        }
        attempts++;
        onPause({ delay, attempt: attempts, resumeAt: now() + delay });
        await sleep(delay);
        onResume();
        // Probe only the failed vehicle, retaining the same session and cookies.
      }
    }
  };
}
