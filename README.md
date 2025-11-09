# Project Name

NextjsAPI
_API endpoints for user and product related data resources._

![](header.png)

## Live URL
[https://nextjs-api-five-psi.vercel.app/](https://nextjs-api-five-psi.vercel.app/)


## Tech Stack

**Client:** Nextjs

**Server:** Nextjs

**Styling:** TailwindCSS

**Database:** Mongodb

**Authentication method:** JWT, Bearer

**Authentication provider:** Better-auth


## Features

**User**
- Password hashing via Bcryptjs
- Better-auth authentication system
- Custom JWT cookies, Bearer token system
- Protected routes that requires authenticated request
- Admin role required routes
- Proper cors and headers setup

**Product**
- Paginated data view
- Category based data finding
- Custom filters and search terms
- Cache control mechanism
- Proper cors and headers setup


## Lessons Learned

- App routing
- Route protection
- Authenticated route
- Role based access route
- JWT cookie encoding decoding
- Bearer token management
- Better-auth implementation
- CORS Headers setup


## Usage example
GET Request
```sh
/api/users
```
```sh
/api/users/golamazam
```
```sh
/api/products
```
```sh
/api/products/{productId}?productAltId={}
```

POST Request
```sh
/api/users/{userId}

{   
    "userName": "",
    "userEmail": "",
    "userPassword": "",
    "isMfaEnabled": false
}
```
```sh
/api/users/{productId}

{
    "productName": "",
    "productAltId": "",
    "productCategory": "",
    "productImageLink": ""
}
```


## Related

Here are some of my related projects

[E-commerce Outlet](https://github.com/GolamAzamShakil/ecommerceReactApp)

[Fetch Post Application](https://github.com/GolamAzamShakil/ApiFetchPostApplication)

## 🔗 Links
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://golam-azam.vercel.app/)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/md-golam-azam-4a6a30291/)


## Meta

Md. Golam Azam – golamazam1010@gmail.com

[https://github.com/GolamAzamShakil](https://github.com/GolamAzamShakil/)

## Contributing

1. Fork it (<https://github.com/GolamAzamShakil/nextjs-api/forks>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/datadog-metrics.svg?style=flat-square
[npm-url]: https://npmjs.org/package/datadog-metrics
[npm-downloads]: https://img.shields.io/npm/dm/datadog-metrics.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/dbader/node-datadog-metrics/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/dbader/node-datadog-metrics
[wiki]: https://github.com/yourname/yourproject/wiki
