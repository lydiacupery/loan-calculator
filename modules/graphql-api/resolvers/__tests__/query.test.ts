// import * as Blueprint from "modules/blueprints";
// import { GetLoggedInUser } from "modules/client/graphql/types.gen";
// import { withContext } from "__tests__/db-helpers";

// todo - if feeeling ambitious right a pagination test
// describe("Query", () => {
//   describe("logged in user", () => {
//     it(
//       "returns user logged in context",
//       withContext({
//         userScenario: universe => universe.insert(Blueprint.employee),
//         async run(ctx, { user }) {
//           let result = await ctx.apolloClient.query<GetLoggedInUser.Query>({
//             query: GetLoggedInUser.Document,
//           });
//           expect(result.data.loggedInUser.id).toEqual(user!.id);
//         },
//       })
//     );
//   });
// });
