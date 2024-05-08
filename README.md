# HTML API

Should we be serving our APIs in HTML? A thought experiment.

[Example API](https://dylanfprice.github.io/html-api)

## Problems with CRUD "REST" APIs

- JSON
    - Small selection of primitive types. E.g. no native date or time types.
    - Files are difficult!
    - Floating point numbers need to be serialized as string if you want to preserve precision.
    - Client needs intimate knowledge of schema in order to parse. Jsonschema helps but is communicated out of band and easily gets out of date.
- CRUD aka "database over HTTP"
    - No HATEOAS: client has to understand a lot of business logic. I.e. they have to understand the mapping of a user's intent to a set of reads and writes to disparate objects that will achieve that intent.
    - All this business logic is communicated out of band via docs, which take a lot of work to maintain.
    - Interaction patterns are unpredictable.

## Problems with GraphQL APIs

GraphQL has some advantages: nice tooling, a better type system, and it encourages meaningful mutations. But it also has it's problems.

- Caching.
    - I can't tell you how many hours I've spent debugging the Apollo client cache and setting up cache keys and merge functions.
    - This is a reinvent-the-wheel situtation.
- No URIs.
    - Well if you use the relay standard then you have some approximation of this with object ids. But it's pretty kludgy and there's no good way to link to an object that lives outside of your own graph.
- Still no HATEOAS.
    - Want to understand how to call a mutation? Inspect the types and read the docs manually.
    - Want to understand when or why you would call a mutation? Inspect the types and read the docs manually.
- Type system.
    - It's definitely better, but we still don't have a native date or time type.
    - File are still hard!
    - Still JSON under the hood, so we rely on the well-built GraphQL library in our favorite language to understand the protocol details.

## Problems with Hypermedia JSON APIs

E.g. [HAL](https://en.wikipedia.org/wiki/Hypertext_Application_Language), [JSON Hyperschema](https://json-schema.org/draft/2019-09/json-schema-hypermedia), [Siren](https://github.com/kevinswiber/siren), etc.

- Still JSON
- Tooling
    - These never caught on so the level of tooling like there is around GraphQL never got built.
    - So they are a bit difficult to actually use as a client. There are some attempts e.g. [Ketting](https://github.com/badgateway/ketting).

## HTML APIs

If we use html as a format, it's pretty interesting.

Check out the [example API](https://dylanfprice.github.io/html-api) I threw together.

- Great type system and the schema is delivered with the data.
    - HTML5 input types are nearly as expressive as Jsonschema. `min`, `max`, `step`, `minLength`, `maxLength`, `pattern`, `required`, it's all there.
    - Native date and time types! Plus email, URL, etc.
    - Files are easy! `multipart/form-data` to the rescue.
    - No floating point serialization issues.
    - Unlike JSON, if you receive a set of HTML5 input elements you know exactly how to parse them.
- HATEOAS
    - We can include links to HTML forms in our responses, allowing clients to discover what actions are available (based on current state) and how to execute them.
    - By adopting [htmx](https://htmx.org/) as a convention, we can make forms which PUT, DELETE, etc.
- HTML makes for a great self-documenting, natively browseable API format.
    - Like Swagger or GraphiQL, but there's no separate tooling and it's a lot more flexible.
- Unlike the hypermedia JSON APIs, HTML has good tooling.
    - Easy to generate. 
    - Easy to parse. A small amount of elbow grease is required to translate into an object/map/dict in your favorite language, but not much, mostly just mapping HTML5 types to language types.
- All the other benefits of REST: URIs, Caching, etc.
    - We can simply and easily link resources to each other (no need to tell our code that `foo_id` is a "foreign key" to a foo and we can look up that foo by going to `/foo/{id}`--or the GraphQL equivalent of this). 
    - Not only can we link to resources, but we can use [link relations](https://www.iana.org/assignments/link-relations/link-relations.xhtml) (i.e. `rel`) to describe what kind of relationship it is.
    - Full semantics of HTTP caching. E.g. you could track the Etag on a form to see if an API endpoint changes, as a simple form of contract testing.

### Downsides

Of course there are some downsides, and I'm sure more that I am not thinking of.

- No nested types. We can approximate with pseudo-standards like `phone[0].number` as the field name.
- Not quite prescriptive enough. We need some conventions for how we can reliably find data, links, etc. in an html document. It could be as simple as "parse all `<input>` tags to get the data," "parse all `<a>` tags to get the links," and "if a link returns a document with a `<form>` tag then that represents an API action which can be taken." 
