from src.dedupe import canonicalize


def test_normalize_basic():
    assert canonicalize('  transformer  ') == 'Transformer'
    assert canonicalize('acoustic   sensors') == 'Acoustic Sensor'
    assert canonicalize('CPU') == 'Cpu'
