import { ReactNode } from 'react';
import { topics } from '../utils/constants';
import { useRouter } from 'next/router';
import { HiOutlineHashtag } from 'react-icons/hi2';
import useTopics from '../hooks/useTopics';

interface TopicProp {
  topic: { name: string; icon: ReactNode };
}

function Topic({ topic }: TopicProp) {
  const router = useRouter();
  const activeTopic = router.query.topic;

  const clickTopicHandler = (topicName: string) =>
    router.push({ pathname: '/', query: { topic: topicName } });

  return (
    <button
      aria-label={topic.name}
      onClick={() => clickTopicHandler(topic.name)}
      key={topic.name}
      className={`${
        topic.name === activeTopic
          ? 'active-topic'
          : 'border-gray-200 bg-gray-100 text-gray-800 hover:border-gray-300 hover:bg-gray-200 dark:bg-darkBtn dark:text-gray-200 dark:hover:bg-darkBtnHover'
      } flex items-center justify-center rounded-full border px-3 py-2 text-sm dark:border-darkSecondary`}
    >
      {topic.icon} <p className='ml-2'>{topic.name}</p>
    </button>
  );
}

export default function PopularTopics() {
  const { data: publishedTopics } = useTopics();
  if (!publishedTopics?.length) return null;

  return (
    <div className='mb-2'>
      <h2 className='mb-3 font-semibold text-gray-500 dark:text-gray-400'>
        Popular Topic
      </h2>

      <div className='flex flex-wrap gap-2'>
        {publishedTopics.map((name) => (
          <Topic
            key={name}
            topic={{
              name,
              icon: topics.find((topic) => topic.name === name.toLowerCase())?.icon ??
                <HiOutlineHashtag size={20} aria-hidden='true' />,
            }}
          />
        ))}
      </div>
    </div>
  );
}
