// import * as crypto from "crypto";

// export function hashInt(n: number) {
//   return parseInt(
//     crypto
//       .createHash("sha256")
//       .update(n.toString())
//       .digest("hex")
//       .slice(0, 10),
//     16
//   );
// }

// export class Entropy {
//   i: number;
//   constructor(origin: number) {
//     this.i = origin;
//   }

//   public nextInt(min: number = 0, max: number = Number.MAX_SAFE_INTEGER) {
//     return min + (++this.i % (max - min));
//   }
// }

export const newHelloFunction = () => {
  return "module function";
};
