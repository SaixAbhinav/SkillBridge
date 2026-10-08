import re


def test_seed_data_loads(store):
    assert len(store.students) == 16
    assert len(store.businesses) == 5
    assert store.students["S01"].name == "Ananya Reddy"
    assert store.projects == {}


def test_vocabulary_is_normalized_and_sorted(store):
    vocab = store.vocabulary()
    assert "whatsapp api" in vocab
    assert vocab == sorted(set(vocab))


def test_id_generators(store):
    assert store.new_project_id() == "P001"
    assert re.fullmatch(r"SB-\d{4}-[0-9A-F]{6}", store.new_cert_id())
