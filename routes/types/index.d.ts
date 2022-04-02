// import { Request } from 'express'

// type queryKeys = 'id' | 'name'

// export interface ExRequest extends Request {
//   query: {
//     [key in queries]: string
//   }
// }

export declare module 'express' {

  type querykeys = 'id' |'name';

  interface Request {
    query: {[key in querykeys]: string | undefined}
  }
}
