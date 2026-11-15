import axios from 'axios';
import useSWR from 'swr';

export default function useTopics() {
  return useSWR('/api/topics', async (url) => {
    const { data } = await axios.get<string[]>(url);
    return data;
  });
}
