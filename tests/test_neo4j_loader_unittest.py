import unittest
from unittest.mock import patch, MagicMock


class TestNeo4jLoader(unittest.TestCase):
    def test_normalize_id(self):
        from src.dedupe import canonicalize
        self.assertEqual(canonicalize('  transformer  '), 'Transformer')
        self.assertEqual(canonicalize('acoustic   sensors'), 'Acoustic Sensor')

    @patch('neo4j.GraphDatabase')
    def test_load_from_dict_calls(self, mock_graphdb):
        import sys
        # Ensure a fake neo4j module exists so lazy imports succeed
        fake_neo4j = MagicMock()
        fake_neo4j.GraphDatabase = mock_graphdb
        sys.modules['neo4j'] = fake_neo4j

        # Mock driver/session/transaction
        mock_driver = MagicMock()
        mock_session = MagicMock()
        mock_driver.session.return_value.__enter__.return_value = mock_session
        mock_graphdb.driver.return_value = mock_driver

        from src.neo4j_loader import Neo4jLoader

        loader = Neo4jLoader('bolt://fake', 'u', 'p')

        sample = {
            'nodes': [
                {'id': 'Transformer', 'type': 'Model', 'properties': {'confidence': 0.9}},
            ],
            'relationships': [
                {'source': 'Transformer', 'target': 'Attention', 'type': 'USES', 'properties': {'evidence': 'paper'}}
            ]
        }

        # Should not raise
        loader.load_from_dict(sample)

        # Verify session used to merge node and create relationship
        self.assertTrue(mock_session.write_transaction.called)
        # Clean up fake module
        sys.modules.pop('neo4j', None)


if __name__ == '__main__':
    unittest.main()
