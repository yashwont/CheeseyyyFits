import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FlashSalesBanner from '../components/FlashSalesBanner';
import NewCollection from '../components/NewCollection';
import Offers from '../components/Offers';
import Shop from '../components/Shop';
import About from '../components/About';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

function Home() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar scrollTo={scrollTo} />
      <Hero />
      <FlashSalesBanner />
      <NewCollection />
      <Offers />
      <Shop />
      <About />
      <Contact />
      <Footer />
    </>
  );
}

export default Home;
