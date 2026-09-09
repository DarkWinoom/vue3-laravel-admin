declare namespace Api {
  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    type MenuRoute = ElegantConstRoute;

    interface UserRoute {
      routes: MenuRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }
  }
}
