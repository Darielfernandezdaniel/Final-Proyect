export default {
  routes: [
    '/', 
    '/home', 
    '/register', 
    '/UserPage', 
    '/register/:param'
  ],
  getPrerenderParams(route: string) {
    if (route === '/register/:param') {
      return [
        { param: 'join' },
        { param: 'login' }
      ];
    }
    return [];
  }
};