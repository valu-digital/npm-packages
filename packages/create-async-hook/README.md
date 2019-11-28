# React Hook Factory for Async Functions

With focus on simple pagination.

## Install

    npm install @valu/create-async-hook

## Usage

```tsx
import { createAsyncHook } from "@valu/create-async-hook";

const getPostsQuery = gql`
    query getPosts($cursor: String) {
        posts(after: $cursor) {
            pageInfo {
                hasNextPage
                endCursor
            }
            nodes {
                id
                title
            }
        }
    }
`;

const usePagedPosts = createAsyncHook(
    async variables => {
        return request("/graphql", {
            query: getPostsQuery,
            variables: {
                cursor: variables.cursor,
            },
        });
    },
    {
        initialState: {
            endCursor: null,
            hasNextPage: true,
            posts: [],
        },
        update(state, response, meta) {
            return {
                posts: state.posts.concat(res.data.posts.nodes),
                endCursor: res.data.posts.pageInfo.endCursor,
                hasNextPage: res.data.posts.pageInfo.hasNextPage,
            };
        },
    },
);

function Component() {
    const [cursor, setCursor] = React.useState(null);

    const res = usePagedPosts({ variables: { cursor: cursor } });

    const fetchMore = () => {
        setCursor(res.state.endCursor);
    };

    return (
        <>
            <ul>
                {res.state.posts.map(post => (
                    <li key={post.id}>{post.title}</li>
                ))}
            </ul>
            <button onClick={res.fetchMore}>more</button>
            <Spinner show={res.loading} />
        </>
    );
}
```
