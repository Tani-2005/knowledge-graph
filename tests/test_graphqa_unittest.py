import unittest
from unittest.mock import MagicMock, patch


class TestGraphQA(unittest.TestCase):
    @patch('neo4j.GraphDatabase')
    def test_nl_to_cypher_and_answer(self, mock_graphdb):
        # Provide a fake driver/session/run that yields simple records
        mock_driver = MagicMock()
        mock_session = MagicMock()
        fake_record = {'model': 'Transformer', 'relation': 'USES', 'metric': 'Accuracy'}
        mock_result = [fake_record]
        mock_session.run.return_value = mock_result
        mock_driver.session.return_value.__enter__.return_value = mock_session
        mock_graphdb.driver.return_value = mock_driver

        import sys
        fake_neo4j = MagicMock()
        fake_neo4j.GraphDatabase = mock_graphdb
        sys.modules['neo4j'] = fake_neo4j

        from src.graphqa import GraphQA

        g = GraphQA('bolt://fake', 'u', 'p')
        out = g.answer('Find models that use the metric accuracy')
        self.assertIn('cypher', out)
        self.assertIn('results', out)
        # cleanup
        sys.modules.pop('neo4j', None)


if __name__ == '__main__':
    unittest.main()
