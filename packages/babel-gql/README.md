# babel-gql

Persisted GraphQL Query Compiler for Babel and a tiny GraphQL client.

## Install

    npm install babel-gql

Add `babel-gql/plugin` to your babel plugins. Ex.

`babel.config.js`:

```js
module.exports = {
    presets: ["@babel/preset-env"],
    plugins: ["babel-gql/plugin"], // <-- add this
};
```

## Usage

```js
import { gql, request } from "babel-gql";

const getPostsQuery = gql`
    query getPosts($first: Int) {
        posts(first: $first) {
            nodes {
                title
                content
            }
        }
    }
`;

request("/graphql", {
    query: getPostsQuery,
    variables: {
        first: 10,
    },
}).then(res => {
    console.log(res.data);
});
```

When compiled to development the `request()` will send a POST request with
the query to the given endpoint.

It basically does this

```js
fetch("/graphql", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
        variables: {
            first: 10,
        },
        query:
            "query getPosts($first: Int) { posts(first: $first) { nodes { title content } } }",
    }),
});
```

but when compiled to the production (`NODE_ENV=production`) the actual
GraphQL query will be completely removed from the bundle and the `request()`
will send a GET request with a hash of the query using the `persistedQuery` extension:

```
GET /graphql?operationName=getPosts
    &variables={"first":10}
    &extensions={"persistedQuery":{"version":1,"sha256Hash":"fc97c4a5683a1c5d521aba0b11a305bfa13e4cded69bf4559cca6e2b6e4c6102"}}
```

To make this work for the backend the plugin will generate a `.queries` directory with the actual queries

```
ls .queries/
getPosts-fc97c4a5683a1c5d521aba0b11a305bfa13e4cded69bf4559cca6e2b6e4c6102.graphql
```

The backend must implement this extension too and be able to load the query
from the file.

### WPGraphQL

If you are using [WPGraphQL][] with WordPress you can use the
[wp-graphql-lock][] extension to implement this via
`pre_graphql_lock_load_query` filter:

```php
add_filter( 'pre_graphql_lock_load_query', function(  $query,  $query_id, $query_name ) {
	$query_dir = realpath( __DIR__ . '/.queries' );
	$full_path = realpath( $query_dir . "/$query_name-$query_id.graphql" );

	// Check for ../../ attacks
	if (strpos($full_path, $query_dir) !== 0) {
		return null;
	}

    return file_get_contents($full_path);
}, 10, 3 );
```

This assumes that `.queries` is commited to git in your theme directly and
the above code is in `functions.php`.

[wp-graphql-lock]: https://github.com/valu-digital/wp-graphql-lock
[wpgraphql]: https://www.wpgraphql.com/

### Usage with React

This does not contain anything React specific but there are multiple React Hooks
that can work with Async Functions. Here's few:

-   [@valu/create-async-hook](https://github.com/valu-digital/create-async-hook)
-   [swr](https://github.com/zeit/swr)
-   [react-query](https://github.com/tannerlinsley/react-query)
-   [react-async-hook](https://github.com/slorber/react-async-hook)
