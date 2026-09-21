import unittest
import tempfile
import numpy as np
import cv2
from pathlib import Path
from image_processing import detect, repair
from cloud_worker import safe_url, enqueue, process, work, single_worker
from unittest.mock import patch


class ProcessingTests(unittest.TestCase):
    def test_detection_and_lossless_outside_mask(self):
        rng = np.random.default_rng(5)
        original = rng.integers(30, 200, (480, 640, 3), dtype=np.uint8)
        logo = cv2.imread(str(Path(__file__).with_name('japancars-template.png')))
        original[443:471, 499:627] = logo
        detection = detect(original)
        self.assertTrue(detection['detected'])
        result, mask = repair(original, detection)
        saved = cv2.imdecode(cv2.imencode('.png', result)[1], cv2.IMREAD_COLOR)
        self.assertEqual(saved.shape, original.shape)
        self.assertTrue(np.array_equal(original[mask == 0], saved[mask == 0]))

    def test_no_watermark_does_not_match(self):
        plain = np.full((480, 640, 3), 110, dtype=np.uint8)
        self.assertFalse(detect(plain)['detected'])

    def test_worker_compresses_without_model_calls(self):
        image = np.full((480, 640, 3), 110, dtype=np.uint8)
        source = cv2.imencode('.jpg', image)[1].tobytes()
        class Cloud:
            def __init__(self): self.calls = []
            def call(self, action, **data):
                self.calls.append((action, data))
                return {'status': 'needs_inspection'}
        cloud = Cloud()
        with patch('cloud_worker.download', return_value=source), patch('builtins.open', side_effect=AssertionError('Photo processing must not write files')), patch.object(Path, 'write_bytes', side_effect=AssertionError('Photo processing must not write files')):
            process(cloud, {'id': 'test', 'lease': 'lease', 'url': 'https://vimg.gabs.biz/a.jpg'})
        self.assertEqual([c[0] for c in cloud.calls], ['original', 'candidate', 'finish'])
        self.assertEqual(cloud.calls[1][1]['mime'], 'image/webp')
        self.assertFalse(cloud.calls[2][1]['detection']['detected'])
        self.assertTrue(cloud.calls[2][1]['detection']['lossyCompression'])

    def test_rate_limit_waits_two_seconds_between_photos(self):
        class Cloud:
            def call(self, action, **data): return {'job': {'id': 'test'}}
        with patch('cloud_worker.process', return_value={'status': 'needs_inspection'}), patch('cloud_worker.time.sleep') as sleep:
            work(Cloud(), 2, interval=2)
        self.assertEqual([c.args[0] for c in sleep.call_args_list], [2, 2])

    def test_source_429_pauses_without_claiming_next_photo(self):
        class Cloud:
            def __init__(self): self.actions = []
            def call(self, action, **data):
                self.actions.append(action)
                return {'job': {'id': 'test'}}
        cloud = Cloud()
        with patch('cloud_worker.process', return_value={'status':'failed','error':'SOURCE_HTTP_429: www.japancars.co.jp'}):
            work(cloud, 10)
        self.assertEqual(cloud.actions, ['claim','pause-source'])

    def test_single_worker_lock(self):
        with tempfile.TemporaryDirectory() as directory:
            config = str(Path(directory)/'config.json')
            with single_worker(config):
                with self.assertRaises(RuntimeError):
                    with single_worker(config): pass

    def test_rejects_non_source_urls(self):
        for url in ('http://127.0.0.1/a', 'https://vimg.gabs.biz.evil.test/a', 'https://user:pw@vimg.gabs.biz/a', 'https://vimg.gabs.biz:444/a', 'file:///etc/passwd'):
            with self.assertRaises(ValueError):
                safe_url(url)

    def test_enqueue_deduplicates_without_mutating_vehicle(self):
        class Cloud:
            def __init__(self): self.calls = []
            def call(self, action, **data): self.calls.append((action, data))
        cloud = Cloud()
        url = 'https://vimg.gabs.biz/AJN335/l/1.jpeg'
        vehicle = {'id': 'TEST', 'imageUrl': url, 'imageUrls': [url]}
        result = enqueue(cloud, [vehicle, vehicle])
        self.assertEqual(result['submitted'], 1)
        self.assertEqual(vehicle['imageUrl'], url)
        self.assertEqual(cloud.calls[0][0], 'enqueue')


if __name__ == '__main__':
    unittest.main()
