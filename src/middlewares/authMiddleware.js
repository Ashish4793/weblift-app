const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // User is authenticated, proceed to the next middleware
    }
    res.redirect("/auth");
  };
  
export default ensureAuthenticated;
  