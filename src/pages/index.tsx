import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { getPrismicClient, PrismicConfig } from '../services/prismic';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(
    postsPagination.results.map(result => {
      return {
        ...result,
        first_publication_date: format(
          new Date(result.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    })
  );

  function handleNextPage(): void {
    fetch(nextPage).then(response => {
      response.json().then(responsePrismic => {
        setNextPage(responsePrismic.next_page);

        const postList: Post[] = responsePrismic.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post?.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPosts([...posts, ...postList]);
      });
    });
  }

  return (
    <div className={commonStyles.container}>
      <Header />
      {posts.map(post => (
        <div className={styles.postItemContainer}>
          <Link href={`/post/${post.uid}`}>
            <a>
              <h2>{post.data.title}</h2>
              <p>{post.data.subtitle}</p>
              <section>
                <div>
                  <FiCalendar color="#BBBBBB" />
                  <span>{post?.first_publication_date}</span>
                </div>
                <div>
                  <FiUser color="#BBBBBB" />
                  <span>{post.data.author}</span>
                </div>
              </section>
            </a>
          </Link>
        </div>
      ))}

      {postsPagination.next_page !== null && (
        <footer className={styles.morePost}>
          <button type="button" onClick={handleNextPage}>
            Carregar mais posts
          </button>
        </footer>
      )}
    </div>
  );
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient({} as PrismicConfig);
  const postsResponse = await prismic.getByType('posts');

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        author: post.data.author,
        subtitle: post.data.subtitle,
        title: post.data.title,
      },
    } as Post;
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
