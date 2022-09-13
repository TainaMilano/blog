import { GetStaticPaths, GetStaticProps } from 'next';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  console.log('🚀 ~ file: [slug].tsx ~ line 37 ~ Post ~ post', post);
  const readTime = post.data?.content.reduce((sumTotal, content) => {
    const textTime = RichText.asText(content.body).split(' ').length;
    return Math.ceil(sumTotal + textTime / 200);
  }, 0);

  return (
    <>
      <div className={commonStyles.container}>
        <Header />
      </div>

      <img
        className={styles.banner}
        src={post.data?.banner.url}
        alt={post.data?.title}
      />

      <div className={commonStyles.container}>
        <main className={styles.content}>
          <h1>{post.data.title}</h1>

          <section>
            <div>
              <FiCalendar color="#BBBBBB" />
              <time>{post.first_publication_date}</time>
            </div>
            <div>
              <FiUser color="#BBBBBB" />
              <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock color="#BBBBBB" />
              <span>{readTime} min</span>
            </div>
          </section>

          {post.data?.content.map(content => (
            <article key={content?.heading}>
              <strong>{content?.heading}</strong>

              {content.body.map((body, index) => {
                const key = index;

                return (
                  <div
                    key={key}
                    dangerouslySetInnerHTML={{ __html: body.text }}
                  />
                );
              })}
            </article>
          ))}
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const slugs = posts.results.map(slug => slug.uid);

  return {
    paths: slugs.map(slug => {
      return {
        params: { slug },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});
  console.log(
    '🚀 ~ file: [slug].tsx ~ line 53 ~ getStaticProps ~ response.data',
    response.data
  );

  const post = {
    slug,
    title: response.data.title,
    first_publication_date: format(
      new Date(response.last_publication_date),
      "d 'de' MMMM 'de' yyyy",
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
