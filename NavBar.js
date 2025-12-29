export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;

      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full bg-[#171717] shadow-md transition-transform duration-300 z-50 ${visible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      {/* แถวบน */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <Image
            src="/LifesCosWhite.png"
            alt="Life'Cos Logo"
            width={175}
            height={175}
          />
        </Link>

      </div>
      {/* แถวล่าง: เมนูหลัก */}
      <div className="max-w-6xl mx-auto px-6 pb-4 flex justify-center items-center">
        <ul className="flex justify-left space-x-10 text-white text-base md:text-base font-bold">
          <li><Link 
          href="/"
          className="hover:text-gray-300">Home</Link></li>
          <li>
            <Link 
            href="/Discovery/1"
            className="hover:text-gray-300">Discovery</Link></li>
          <li>
            <Link
              href="https://www.facebook.com/profile.php?id=61564649259527"
              className="text-blue-400 hover:text-blue-500">Facebook</Link>
          </li>
          <li>
            <Link
              href="https://www.instagram.com/doom_rody/?__pwa=1"
              className="text-pink-400 hover:text-pink-500">Instagram</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
