import Breadcrumb from '@/components/common/breadcrumb.component';
import { Category } from '@/components/features/category.component';
import { Post } from '@/components/features/post.component';
import Profile from '@/components/features/profile.component';
import type { PostDto } from '@/kodkafa/client/schemas';

type PostContentProps = {
  post: PostDto;
};

export function PostContent({ post }: PostContentProps) {
  const type = post.tags?.includes('profile') ? 'profile' : post.type || 'post';

  return (
    <div className='w-full max-w-full p-4 pt-4! lg:p-8'>
      <Breadcrumb
        className='text-xs uppercase'
        paths={[{ children: post.slug }]}
      />
      {type === 'category' && <Category post={post} />}
      {type === 'post' && <Post post={post} />}
      {type === 'profile' && <Profile post={post} />}
    </div>
  );
}
