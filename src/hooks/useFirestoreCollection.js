import { useCallback, useEffect, useState } from 'react';
import {
  byCreatedDesc,
  createDocument,
  deleteDocument,
  listDocuments,
  subscribeToCollection,
  updateDocument,
} from '../services/firestoreService';

export function useFirestoreCollection(collectionName, constraints = null, options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { realtime = true } = options;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await listDocuments(collectionName, constraints || [byCreatedDesc()]);
      setItems(result);
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [collectionName, constraints]);

  useEffect(() => {
    if (!realtime) {
      fetchItems();
      return undefined;
    }

    setLoading(true);
    setError('');

    return subscribeToCollection(
      collectionName,
      constraints || [byCreatedDesc()],
      (result) => {
        setItems(result);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Nao foi possivel carregar os dados.');
        setLoading(false);
      },
    );
  }, [collectionName, constraints, fetchItems, realtime]);

  const createItem = async (payload) => {
    const id = await createDocument(collectionName, payload);
    await fetchItems();
    return id;
  };

  const updateItem = async (id, payload) => {
    await updateDocument(collectionName, id, payload);
    await fetchItems();
  };

  const deleteItem = async (id) => {
    await deleteDocument(collectionName, id);
    await fetchItems();
  };

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
