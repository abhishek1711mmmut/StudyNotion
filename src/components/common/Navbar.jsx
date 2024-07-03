import React, { useEffect, useRef, useState } from "react";
import { Link, matchPath } from "react-router-dom";
import logo from "../../assets/Logo/Logo-Full-Light.png";
import { NavbarLinks } from "../../data/navbar-links";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { AiOutlineMenu, AiOutlineShoppingCart } from "react-icons/ai";
import { RxCross2 } from "react-icons/rx";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import ProfileDropDown from "../core/Auth/ProfileDropDown";
import { apiConnector } from "../../services/apiconnector";
import { categories } from "../../services/apis";
import { ACCOUNT_TYPE } from "../../utils/constants";

const Navbar = () => {
  // console.log("Printing base url: ",process.env.REACT_APP_BASE_URL);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const { totalItems } = useSelector((state) => state.cart);
  const location = useLocation();
  const matchRoute = (route) => {
    return matchPath({ path: route }, location.pathname);
  };

  const [subLinks, setsubLinks] = useState([]);

  const toggleMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const mobileMenuRef = useRef();
  const dropdownRef = useRef();
  const catalogRef = useRef();

  // Close the mobile menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
        setMobileMenuVisible(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        catalogRef.current &&
        !catalogRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
    };

    if (mobileMenuVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuVisible]);

  // api call in useEffect
  useEffect(() => {
    const fetchSublinks = async () => {
      setLoading(true);
      const response = await apiConnector("GET", categories.CATEGORIES_API);
      // console.log('GET ALL CATEGORIES API RESPONSE........', response);
      const result = await response?.data?.data;
      if (result) {
        setsubLinks(result);
      }
      setLoading(false);
    };
    fetchSublinks();
  }, []);

  return (
    <div
      className={`flex h-14 items-center justify-center border-b-[1px] border-b-richblack-700 ${
        location.pathname !== "/" ? "bg-richblack-800" : ""
      } transition-all duration-200`}
    >
      <div className="flex w-11/12 max-w-maxContent items-center justify-between">
        {/* logo */}
        <Link to="/">
          <img src={logo} alt="" width={160} height={32} loading="lazy" />
        </Link>

        {/* nav links */}
        <nav className="hidden md:block">
          <ul className="flex gap-x-6 text-richblack-25">
            {NavbarLinks.map((link, index) => (
              <li key={index}>
                {link.title === "Catalog" ? (
                  <div
                    className={`group relative flex cursor-pointer items-center gap-1 ${
                      matchRoute("/catalog/:catalogName")
                        ? "text-yellow-25"
                        : "text-richblack-25"
                    }`}
                  >
                    <p>{link.title}</p>
                    <BsChevronDown />

                    <div className="invisible absolute left-[50%] top-[50%] z-[1000] flex w-[200px] translate-x-[-50%] translate-y-[3em] flex-col rounded-lg bg-richblack-5 p-4 text-richblack-900 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-[1.65em] group-hover:opacity-100 lg:w-[300px]">
                      <div className="absolute left-[50%] top-0 translate-x-[80%] translate-y-[-40%] -z-10 h-6 w-6 rotate-45 select-none rounded bg-richblack-5"></div>

                      {loading ? (
                        <p className="text-center">Loading...</p>
                      ) : subLinks.length ? (
                        <>
                          {subLinks
                            ?.filter((subLink) => subLink?.courses?.length > 0)
                            ?.map((subLink, i) => (
                              <Link
                                to={`/catalog/${subLink.name
                                  .split(" ")
                                  .join("-")
                                  .toLowerCase()}`}
                                className="rounded-lg bg-transparent py-4 pl-4 hover:bg-richblack-50"
                                key={i}
                              >
                                <p>{subLink.name}</p>
                              </Link>
                            ))}
                        </>
                      ) : (
                        <p className="text-center">No Courses Found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Link to={link?.path}>
                    <p
                      className={`${
                        matchRoute(link?.path)
                          ? "text-yellow-25"
                          : "text-richblack-25"
                      }`}
                    >
                      {link.title}
                    </p>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* login/signup/dashboard */}
        <div className="hidden items-center gap-x-4 md:flex">
          {user && user?.accountType !== ACCOUNT_TYPE.INSTRUCTOR && (
            <Link to="/dashboard/cart" className="relative">
              <AiOutlineShoppingCart className="text-2xl text-richblack-100" />
              {totalItems > 0 && (
                <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center overflow-hidden rounded-full bg-richblack-600 text-center text-xs font-bold text-yellow-100">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
          {token === null && (
            <Link to="/login">
              <button className="border border-richblack-700 bg-richblack-800 px-[12px] py-[8px] text-richblack-100 rounded-md">
                Log In
              </button>
            </Link>
          )}
          {token === null && (
            <Link to="/signup">
              <button className="border border-richblack-700 bg-richblack-800 px-[12px] py-[8px] text-richblack-100 rounded-md">
                Sign Up
              </button>
            </Link>
          )}
          {token !== null && <ProfileDropDown />}
        </div>
        <button className="mr-2 md:hidden" onClick={toggleMobileMenu}>
          {mobileMenuVisible ? (
            <RxCross2 fontSize={24} className="text-[#AFB2BF]" />
          ) : (
            <AiOutlineMenu fontSize={24} fill="#AFB2BF" />
          )}
        </button>

        {/* Mobile menu */}
        {mobileMenuVisible && (
          <div
            ref={mobileMenuRef}
            className="absolute z-50 top-14 left-0 w-full bg-richblack-900/90 md:hidden"
          >
            <nav className="flex flex-col items-center space-y-4 py-4">
              {NavbarLinks.map((link, index) => (
                <div key={index}>
                  {link.title === "Catalog" ? (
                    <div className="relative flex cursor-pointer items-center gap-1 text-richblack-25">
                      <button
                        ref={catalogRef}
                        className="flex items-center gap-1"
                        onClick={toggleDropdown}
                      >
                        {link.title}
                        {dropdownVisible ? <BsChevronUp /> : <BsChevronDown />}
                      </button>
                      {dropdownVisible && (
                        <div
                          ref={dropdownRef}
                          className="absolute left-[50%] -translate-x-[50%] top-8 w-52 z-10 flex flex-col rounded-lg bg-richblack-5 p-2 text-richblack-900"
                        >
                          {loading ? (
                            <p className="text-center">Loading...</p>
                          ) : subLinks.length ? (
                            <>
                              {subLinks
                                ?.filter(
                                  (subLink) => subLink?.courses?.length > 0
                                )
                                ?.map((subLink, i) => (
                                  <Link
                                    to={`/catalog/${subLink.name
                                      .split(" ")
                                      .join("-")
                                      .toLowerCase()}`}
                                    className="rounded-lg bg-transparent py-2 pl-4 hover:bg-richblack-50"
                                    key={i}
                                    onClick={() => {
                                      setDropdownVisible(false);
                                      setMobileMenuVisible(false);
                                    }}
                                  >
                                    <p>{subLink.name}</p>
                                  </Link>
                                ))}
                            </>
                          ) : (
                            <p className="text-center">No Courses Found</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={link?.path}
                      onClick={() => setMobileMenuVisible(false)}
                    >
                      <p
                        className={`${
                          matchRoute(link?.path)
                            ? "text-yellow-25"
                            : "text-richblack-25"
                        }`}
                      >
                        {link.title}
                      </p>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
            <div className="flex flex-col items-center space-y-4 pb-4">
              {token === null && (
                <>
                  <Link to="/login" onClick={() => setMobileMenuVisible(false)}>
                    <button className="border border-richblack-700 bg-richblack-800 px-[12px] py-[8px] text-richblack-100 rounded-md">
                      Log In
                    </button>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuVisible(false)}
                  >
                    <button className="border border-richblack-700 bg-richblack-800 px-[12px] py-[8px] text-richblack-100 rounded-md">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
              {token !== null && <ProfileDropDown />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
