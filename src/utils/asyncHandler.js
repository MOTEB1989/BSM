/**
 * Async Handler Wrapper
 * 
 * Eliminates try-catch boilerplate in Express route handlers.
 * Automatically catches errors and passes them to Express error middleware.
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersFromDB();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
