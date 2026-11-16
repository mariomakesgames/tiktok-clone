import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Session } from 'next-auth';
import { getSession, signIn } from 'next-auth/react';
import { nanoid } from 'nanoid';
import useSWR from 'swr';
import useTopics from '../../hooks/useTopics';
import {
  publishVideo,
  uploadVideo,
  videoFileError,
  videoPublishError,
} from '../../utils/video-publishing';
import {
  isOwnedVideoPath,
  MAX_VIDEO_MB,
  VIDEO_CONTENT_TYPES,
} from '../../utils/video-upload';
import styles from './bulk-upload.module.css';

type UploadStatus =
  | 'queued'
  | 'invalid'
  | 'uploading'
  | 'publishing'
  | 'published'
  | 'failed';

interface UploadItem {
  id: string;
  file: File;
  caption: string;
  status: UploadStatus;
  error?: string;
  pathname?: string;
  postId?: string;
  progress?: number;
}

const statusLabels: Record<UploadStatus, string> = {
  queued: 'Ready',
  invalid: 'Invalid file',
  uploading: 'Uploading',
  publishing: 'Publishing',
  published: 'Published',
  failed: 'Failed',
};

export default function BulkUpload() {
  const { data: session, isLoading } = useSWR(
    '/api/auth/session',
    () => getSession() as Promise<(Session & { _id?: string }) | null>,
  );
  const { data: topics, error: topicsError } = useTopics();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [topic, setTopic] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const userId = session?._id;
  const topicUnavailable = Boolean(topic && topics && !topics.includes(topic));
  const pending = items.filter(
    (item) => item.status === 'queued' || item.status === 'failed',
  );
  const publishedCount = items.filter(
    (item) => item.status === 'published',
  ).length;
  const failedCount = items.filter((item) => item.status === 'failed').length;
  const canPublish = Boolean(
    userId &&
      pending.length &&
      !isRunning &&
      !topicUnavailable &&
      pending.every(({ caption }) => caption.trim()),
  );

  function updateItem(id: string, changes: Partial<UploadItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  function addVideos(event: ChangeEvent<HTMLInputElement>) {
    const added = Array.from(event.currentTarget.files ?? []).map(
      (file): UploadItem => {
        const error = videoFileError(file);
        return {
          id: nanoid(),
          file,
          caption: file.name.replace(/\.[^.]*$/, '').trim() || 'Video',
          status: error ? 'invalid' : 'queued',
          error,
        };
      },
    );
    setItems((current) => [...current, ...added]);
    event.currentTarget.value = '';
  }

  async function publishBatch() {
    if (!userId || !canPublish) return;
    setIsRunning(true);
    try {
      for (const item of pending) {
        let pathname = item.pathname;
        if (pathname && !isOwnedVideoPath(pathname, userId)) {
          updateItem(item.id, {
            status: 'failed',
            error:
              'Sign in with the account that uploaded this video, then retry.',
          });
          continue;
        }

        try {
          if (!pathname) {
            updateItem(item.id, {
              status: 'uploading',
              error: undefined,
              progress: 0,
            });
            const video = await uploadVideo(item.file, userId, (progress) =>
              updateItem(item.id, { progress }),
            );
            pathname = video.pathname;
          }
          updateItem(item.id, {
            status: 'publishing',
            pathname,
            error: undefined,
          });
          const postId = await publishVideo(pathname, item.caption, topic);
          updateItem(item.id, { status: 'published', postId });
        } catch (error) {
          updateItem(item.id, {
            status: 'failed',
            error: pathname
              ? videoPublishError(error)
              : 'Could not upload the video. Try again.',
          });
        }
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className={styles.tool} aria-labelledby='bulk-upload-title'>
      <h1 id='bulk-upload-title'>Bulk video upload</h1>
      <p>Upload MP4 or WebM videos up to {MAX_VIDEO_MB} MB each.</p>
      {isLoading ? (
        <p role='status'>Checking your Robloxtok session…</p>
      ) : !userId ? (
        <>
          <p>Sign in to Robloxtok to publish videos under your account.</p>
          <button
            className={styles.primary}
            type='button'
            onClick={() =>
              void signIn('google', { callbackUrl: '/admin/bulk-upload' })
            }
          >
            Sign in to Robloxtok
          </button>
        </>
      ) : (
        <>
          <fieldset className={styles.options} disabled={isRunning}>
            <label>
              Add videos
              <input
                type='file'
                multiple
                accept={VIDEO_CONTENT_TYPES.join(',')}
                onChange={addVideos}
              />
            </label>
            <label>
              Topic for this batch
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                <option value=''>No topic</option>
                {topicUnavailable && (
                  <option value={topic} disabled>
                    {topic} (unavailable)
                  </option>
                )}
                {topics?.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          {topicsError && <p role='status'>Could not load topics.</p>}
          {topicUnavailable && (
            <p role='status'>Choose another topic before publishing.</p>
          )}
          {items.length > 0 && (
            <>
              <ul className={styles.queue}>
                {items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.itemHeading}>
                      <strong>{item.file.name}</strong>
                      {item.postId ? (
                        <a
                          href={`/video/${encodeURIComponent(item.postId)}`}
                          target='_blank'
                          rel='noreferrer'
                        >
                          View post
                        </a>
                      ) : (
                        <button
                          type='button'
                          disabled={isRunning}
                          aria-label={`Remove ${item.file.name}`}
                          onClick={() =>
                            setItems((current) =>
                              current.filter(({ id }) => id !== item.id),
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <label>
                      Caption
                      <input
                        type='text'
                        value={item.caption}
                        disabled={
                          isRunning ||
                          item.status === 'published' ||
                          item.status === 'invalid'
                        }
                        onChange={(event) =>
                          updateItem(item.id, { caption: event.target.value })
                        }
                      />
                    </label>
                    <div className={styles.status}>
                      {statusLabels[item.status]}
                      {item.status === 'uploading' && (
                        <progress
                          max={100}
                          value={item.progress ?? 0}
                          aria-label={`Uploading ${item.file.name}`}
                        />
                      )}
                      {item.error && (
                        <span className={styles.error}>{item.error}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <button
                  className={styles.primary}
                  type='button'
                  onClick={() => void publishBatch()}
                  disabled={!canPublish}
                >
                  {isRunning
                    ? 'Publishing…'
                    : pending.length === failedCount && failedCount > 0
                      ? `Retry ${failedCount}`
                      : `Publish ${pending.length} ${pending.length === 1 ? 'video' : 'videos'}`}
                </button>
                <span role='status'>
                  {publishedCount} published · {failedCount} failed
                </span>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
