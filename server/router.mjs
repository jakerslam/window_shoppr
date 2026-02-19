/**
 * Match a request pathname against a list of route patterns.
 */
export const matchRoute = ({ method, pathname, routes }) => {
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const match = pathname.match(route.pattern);
    if (!match) {
      continue;
    }

    return {
      handler: route.handler,
      params: route.getParams ? route.getParams(match) : {},
      route,
    };
  }

  return null;
};
