# Local collection, cloud storage

Run `npm run japan-market:local:check` to verify GitHub access without contacting Japan Cars or changing inventory.

Run `npm run japan-market:local` to collect up to 25 additional/refreshed vehicles with the existing two-second request gap. The CLI uses the existing GitHub login. It reads the current immutable cloud snapshot into memory, keeps source responses and galleries in memory, and uploads an atomic commit directly to GitHub. The existing website deployment serves the data after the commit builds. No new HTML, vehicle cache, snapshot, checkpoint, or image files are written to local disk in this mode. Photos remain source URLs, not downloaded images.

This mode does not use the disk-writing reporting wrapper. Existing repository data and past local test files are not removed. This is application-level no-disk storage, not a guarantee about OS paging or crash dumps.

Source challenges stop collection. Verified records can still be uploaded when available. Closing the process before upload discards the in-memory batch; published records remain in the cloud. If the cloud branch changes during scanning, the upload fails closed instead of overwriting newer work. Run again to resume from cloud inventory; there is no durable local retry file.

Admin's run detail button shows per-vehicle added/updated fields and photo additions/removals. Timestamp-only checks are not counted as content updates. Older runs without detailed snapshots say that details were not recorded. The 25-vehicle run from 15 September has been reconstructed from its exact Git commit; it is marked as reconstructed.

The Admin manual scan button still starts the GitHub runner. It does not remotely start a switched-off computer. This local command runs only while this computer is on; no startup task or replacement midnight scheduler is installed by this change.
