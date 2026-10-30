import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── AUTHENTIC CRAFT PRODUCTS ────────────────────────────────────────────────
interface CraftItem {
  id: string;
  name: string;
  nameHi: string;
  region: string;
  category: string;
  price: number;
  artisan: string;
  giCertified: boolean;
  image: string;
  storyEn: string;
  storyHi: string;
}

const PRODUCTS: CraftItem[] = [
  {
    id: '1',
    name: 'Banarasi Katan Silk Zari Saree',
    nameHi: 'बनारसी कातान रेशम ज़री साड़ी',
    region: 'Varanasi, Uttar Pradesh',
    category: 'Handloom Textiles',
    price: 18500,
    artisan: 'Master Ansari & Sons',
    giCertified: true,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    storyEn: 'Referenced in the Rigveda and Buddhist Pali texts as "Kaseyyaka" (Kashi gold cloth). Perfected during the 15th-century Mughal era when Persian floral arabesques (Kalga & Jhallar) merged with sacred Varanasi motifs. Woven with pure mulberry silk and electroplated gold Zari over 45 days on traditional drawlooms.',
    storyHi: 'ऋग्वेद और बौद्ध जातक कथाओं में "कासेय्यक" के नाम से उल्लेखित। 15वीं सदी में मुग़ल काल के दौरान फ़ारसी कल्गा और बनारस के कमल-बेल का ऐतिहासिक संगम हुआ। शुद्ध मलबरी रेशम और सोने-चांदी की ज़री से 45 दिनों में तैयार।',
  },
  {
    id: '2',
    name: 'Jaipur Blue Pottery Floral Urn',
    nameHi: 'जयपुर ब्लू पॉटरी पुष्प कलश',
    region: 'Jaipur, Rajasthan',
    category: 'Ceramics & Decor',
    price: 4200,
    artisan: 'Shilp Guru Kripal Kumbhar',
    giCertified: true,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    storyEn: 'Brought to Rajasthan in the 19th century by Maharaja Sawai Ram Singh II. The only pottery in the world crafted completely clay-free—blended from ground quartz stone, Fuller’s earth, recycled glass, and natural gum, hand-painted with cobalt oxide and low-fired in wood kilns.',
    storyHi: '19वीं शताब्दी में महाराजा सवाई राम सिंह द्वितीय द्वारा आमेर लाया गया। विश्व का एकमात्र अ-मृत्तिका शिल्प (बिना मिट्टी का बर्तन), जो स्फटिक पत्थर, मुल्तानी मिट्टी और काँच के चूर्ण से बनता है और कोबाल्ट नीले से चित्रित होता है।',
  },
  {
    id: '3',
    name: 'Bastar Lost-Wax Dhokra Dancing Bull',
    nameHi: 'बस्तर ढोकरा नंदी बैल प्रतिमा',
    region: 'Bastar, Chhattisgarh',
    category: 'Tribal Metalwork',
    price: 6800,
    artisan: 'Bannuram Baid (National Master)',
    giCertified: true,
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    storyEn: '4,000-year-old unbroken metallurgical lineage tracing directly back to the "Dancing Girl of Mohenjo-daro" (2500 BCE). Hand-molded with riverbed clay and natural beeswax threads, then cast in molten bell-metal. Since each mold is broken upon cooling, no two Dhokra statues are ever alike.',
    storyHi: 'सिंधु घाटी सभ्यता (2500 ई.पू.) की "मोहनजोदड़ो नर्तकी" से जुड़ी 4,000 वर्ष पुरानी धातु ढलाई परंपरा। प्राकृतिक मधुमक्खी मोम और कांसा धातु से निर्मित। सांचा केवल एक बार प्रयोग होने से प्रत्येक रचना अद्वितीय है।',
  },
  {
    id: '4',
    name: 'Kashmiri Handspun Pashmina Shawl',
    nameHi: 'कश्मीरी हथकरघा पश्मीना शॉल',
    region: 'Srinagar, Kashmir',
    category: 'Handloom Textiles',
    price: 24000,
    artisan: 'Ghulam Hassan Craft Guild',
    giCertified: true,
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
    storyEn: 'Known globally as "Soft Gold", harvested exclusively from the underbelly fleece of Changthangi goats in Ladakh at 14,000+ ft. Spun by hand on wooden charkhas and hand-embroidered with micro-needle Sozni needlework depicting traditional Chinar leaf and Badam motifs.',
    storyHi: 'लद्दाख के 14,000 फीट ऊंचे चांगथांग पठार की बकरियों के नर्म अंतःरोम (Fleece) से निर्मित। चरखे पर हाथ से काता गया और बारीक सुई से पारंपरिक चिनार पत्ती की सोज़नी कशीदाकारी की गई।',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'story' | 'cart'>('home');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CraftItem[]>([]);
  const [selectedStory, setSelectedStory] = useState<CraftItem | null>(null);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const addToCart = (item: CraftItem) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  const filteredProducts = PRODUCTS.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.nameHi.includes(q) ||
      p.region.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#701D24" />

      {/* ─── BRANDED HEADER WITH VIRAASAT LOGO ─── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerTagline}>
            {language === 'en' ? "India's Living Heritage" : 'भारत की जीवंत धरोहर'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langBadge} onPress={toggleLanguage}>
            <Text style={styles.langBadgeText}>
              {language === 'en' ? '🇮🇳 हिंदी' : '🌐 English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── MAIN CONTENT ─── */}
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.giBadge}>
                  <Text style={styles.giBadgeText}>✓ 100% GI CERTIFIED</Text>
                </View>
                <View style={styles.fairWageBadge}>
                  <Text style={styles.fairWageBadgeText}>FAIR WAGE DIRECT</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>
                {language === 'en'
                  ? 'Preserving Living Crafts, One Heirloom at a Time'
                  : 'प्राचीन शिल्प कला का संरक्षण, सीधे कारीगर से आपके घर'}
              </Text>

              <Text style={styles.heroSubtitle}>
                {language === 'en'
                  ? 'Direct marketplace connecting 12,400+ master artisans with global connoisseurs. Zero middleman commissions.'
                  : '12,400+ राष्ट्रीय शिल्पकारों से सीधे जुड़ें। बिचौलियों से मुक्त, पूर्ण पारदर्शी मूल्य।'}
              </Text>

              <TouchableOpacity
                style={styles.heroCta}
                onPress={() => setActiveTab('shop')}
              >
                <Text style={styles.heroCtaText}>
                  {language === 'en' ? 'Explore Collection →' : 'शिल्प संग्रह देखें →'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cultural Story Showcase Banner */}
            <TouchableOpacity
              style={styles.aiBanner}
              onPress={() => setActiveTab('story')}
            >
              <Text style={styles.aiBannerTag}>✨ AI HERITAGE STUDIO</Text>
              <Text style={styles.aiBannerTitle}>
                {language === 'en'
                  ? 'Cultural Story & Heritage Vision'
                  : 'सांस्कृतिक कथा एवं धरोहर अन्वेषण'}
              </Text>
              <Text style={styles.aiBannerDesc}>
                {language === 'en'
                  ? 'Discover centuries of oral history, Vedic lineage, and GI origin behind every craft.'
                  : 'प्रत्येक हस्तशिल्प के पीछे छिपी सदियों पुरानी ऐतिहासिक कथा और निर्माण रहस्य जानें।'}
              </Text>
            </TouchableOpacity>

            {/* Curated Heirlooms Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Masterpiece Heirlooms' : 'सहेजी गई धरोहर'}
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('shop')}>
                <Text style={styles.sectionLink}>
                  {language === 'en' ? 'View All' : 'सभी देखें'}
                </Text>
              </TouchableOpacity>
            </View>

            {PRODUCTS.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.featuredCard}>
                <Image source={{ uri: item.image }} style={styles.featuredImage} />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredCategory}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.featuredName}>
                    {language === 'en' ? item.name : item.nameHi}
                  </Text>
                  <Text style={styles.featuredRegion}>📍 {item.region}</Text>
                  <Text style={styles.featuredArtisan}>By {item.artisan}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.featuredPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.storyBtn}
                        onPress={() => setSelectedStory(item)}
                      >
                        <Text style={styles.storyBtnText}>📜 Story</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addToCart(item)}
                      >
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 2: SHOP */}
        {activeTab === 'shop' && (
          <View style={styles.tabContent}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={
                  language === 'en'
                    ? 'Search by craft, silk, pottery, brass...'
                    : 'शिल्प, साड़ी, बर्तन या धातु खोजें...'
                }
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9C8E82"
              />
            </View>

            <Text style={styles.resultsCount}>
              {language === 'en'
                ? `Showing ${filteredProducts.length} authentic artifacts`
                : `${filteredProducts.length} प्रामाणिक हस्तशिल्प उपलब्ध`}
            </Text>

            {filteredProducts.map((item) => (
              <View key={item.id} style={styles.productCard}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <View style={styles.giTagSmall}>
                    <Text style={styles.giTagSmallText}>GI CERTIFIED</Text>
                  </View>
                  <Text style={styles.productName}>
                    {language === 'en' ? item.name : item.nameHi}
                  </Text>
                  <Text style={styles.productRegion}>{item.region}</Text>
                  <Text style={styles.productPrice}>₹{item.price.toLocaleString('en-IN')}</Text>

                  <View style={styles.productActionsRow}>
                    <TouchableOpacity
                      style={styles.smallStoryBtn}
                      onPress={() => setSelectedStory(item)}
                    >
                      <Text style={styles.smallStoryBtnText}>📜 History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallAddBtn}
                      onPress={() => addToCart(item)}
                    >
                      <Text style={styles.smallAddBtnText}>+ Bag</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: CULTURAL STORY AI */}
        {activeTab === 'story' && (
          <View style={styles.tabContent}>
            <View style={styles.storyHero}>
              <Text style={styles.storyHeroHeading}>
                {language === 'en'
                  ? 'Cultural Story & Ethnographic Archive'
                  : 'सांस्कृतिक कहानी एवं लोक इतिहास'}
              </Text>
              <Text style={styles.storyHeroDesc}>
                {language === 'en'
                  ? 'Select any handicraft below to read verified historical archives, Vedic mentions, and artisan techniques.'
                  : 'नीचे दिए गए किसी भी पारंपरिक शिल्प को चुनकर उसका प्रामाणिक इतिहास और प्राचीन उत्पत्ति कथा पढ़ें।'}
              </Text>
            </View>

            {PRODUCTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.storyCardItem}
                onPress={() => setSelectedStory(item)}
              >
                <Image source={{ uri: item.image }} style={styles.storyThumbnail} />
                <View style={styles.storyCardDetails}>
                  <Text style={styles.storyCardTitle}>
                    {language === 'en' ? item.name : item.nameHi}
                  </Text>
                  <Text style={styles.storyCardSubtitle}>📍 {item.region}</Text>
                  <Text style={styles.storyCardPreview} numberOfLines={2}>
                    {language === 'en' ? item.storyEn : item.storyHi}
                  </Text>
                  <Text style={styles.readMoreText}>
                    {language === 'en' ? 'Read Complete Historical Past Story →' : 'संपूर्ण ऐतिहासिक कथा पढ़ें →'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TAB 4: CART */}
        {activeTab === 'cart' && (
          <View style={styles.tabContent}>
            <Text style={styles.cartHeaderTitle}>
              {language === 'en' ? 'Your Heritage Bag' : 'आपकी कला झोली'}
            </Text>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Text style={styles.emptyCartEmoji}>🛍️</Text>
                <Text style={styles.emptyCartTitle}>
                  {language === 'en' ? 'Your bag is empty' : 'आपकी झोली रिक्त है'}
                </Text>
                <Text style={styles.emptyCartDesc}>
                  {language === 'en'
                    ? 'Explore authentic handloom and tribal arts crafted by master artisans.'
                    : 'मास्टर कारीगरों द्वारा निर्मित प्रामाणिक हस्तशिल्प संग्रह देखें।'}
                </Text>
                <TouchableOpacity
                  style={styles.heroCta}
                  onPress={() => setActiveTab('shop')}
                >
                  <Text style={styles.heroCtaText}>
                    {language === 'en' ? 'Start Exploring' : 'शिल्प देखें'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {cart.map((item, index) => (
                  <View key={`${item.id}-${index}`} style={styles.cartItemRow}>
                    <Image source={{ uri: item.image }} style={styles.cartThumbnail} />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>
                        {language === 'en' ? item.name : item.nameHi}
                      </Text>
                      <Text style={styles.cartItemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                      <Text style={styles.cartItemArtisan}>Direct to: {item.artisan}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFromCart(index)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Total & Checkout */}
                <View style={styles.checkoutBox}>
                  <View style={styles.fairWageAssurance}>
                    <Text style={styles.assuranceText}>
                      ✓ 100% of product price goes directly to rural artisan cooperatives
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Payable:</Text>
                    <Text style={styles.summaryValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => alert('Order Placed Successfully! Thank you for supporting Indian artisans.')}
                  >
                    <Text style={styles.checkoutBtnText}>Proceed to Direct Checkout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ─── BOTTOM NAVIGATION TABS ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.navIcon, activeTab === 'home' && styles.navActive]}>🏛️</Text>
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            {language === 'en' ? 'Discover' : 'धरोहर'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('shop')}
        >
          <Text style={[styles.navIcon, activeTab === 'shop' && styles.navActive]}>🛍️</Text>
          <Text style={[styles.navLabel, activeTab === 'shop' && styles.navLabelActive]}>
            {language === 'en' ? 'Shop' : 'हाट'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('story')}
        >
          <Text style={[styles.navIcon, activeTab === 'story' && styles.navActive]}>📸</Text>
          <Text style={[styles.navLabel, activeTab === 'story' && styles.navLabelActive]}>
            {language === 'en' ? 'Story AI' : 'कथा AI'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('cart')}
        >
          <View style={styles.cartIconWrapper}>
            <Text style={[styles.navIcon, activeTab === 'cart' && styles.navActive]}>🛒</Text>
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, activeTab === 'cart' && styles.navLabelActive]}>
            {language === 'en' ? 'Bag' : 'झोली'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── CULTURAL STORY MODAL ─── */}
      {selectedStory && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedStory(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalCategory}>{selectedStory.category.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => setSelectedStory(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedStory.image }} style={styles.modalImage} />
                <Text style={styles.modalTitle}>
                  {language === 'en' ? selectedStory.name : selectedStory.nameHi}
                </Text>
                <Text style={styles.modalRegion}>📍 {selectedStory.region}</Text>
                <Text style={styles.modalArtisan}>Crafted by: {selectedStory.artisan}</Text>

                <View style={styles.storyBodyBox}>
                  <Text style={styles.storyBodyTitle}>📜 Verified Historical Heritage</Text>
                  <Text style={styles.storyBodyText}>
                    {language === 'en' ? selectedStory.storyEn : selectedStory.storyHi}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCta}
                  onPress={() => {
                    addToCart(selectedStory);
                    setSelectedStory(null);
                  }}
                >
                  <Text style={styles.modalCtaText}>
                    + Add to Bag (₹{selectedStory.price.toLocaleString('en-IN')})
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    backgroundColor: '#701D24',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#C59B4B',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logoImage: {
    width: 140,
    height: 38,
  },
  headerTagline: {
    color: '#F2D891',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(242, 216, 145, 0.4)',
  },
  langBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.25)',
    shadowColor: '#221C18',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  giBadge: {
    backgroundColor: '#F3EADB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  giBadgeText: {
    color: '#701D24',
    fontSize: 10,
    fontWeight: '800',
  },
  fairWageBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fairWageBadgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#221C18',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#655B53',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroCta: {
    backgroundColor: '#701D24',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  heroCtaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  aiBanner: {
    backgroundColor: '#2A1F18',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C59B4B',
  },
  aiBannerTag: {
    color: '#F2D891',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  aiBannerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  aiBannerDesc: {
    color: '#D4C8BF',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#221C18',
  },
  sectionLink: {
    fontSize: 13,
    color: '#701D24',
    fontWeight: 'bold',
  },
  featuredCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 2,
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  featuredInfo: {
    padding: 14,
  },
  featuredCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#C59B4B',
    marginBottom: 4,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#221C18',
    marginBottom: 4,
  },
  featuredRegion: {
    fontSize: 12,
    color: '#655B53',
    marginBottom: 2,
  },
  featuredArtisan: {
    fontSize: 12,
    color: '#701D24',
    fontWeight: '600',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
    paddingTop: 10,
  },
  featuredPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#221C18',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  storyBtn: {
    backgroundColor: '#F3EADB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  storyBtnText: {
    color: '#701D24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#701D24',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E6DFD5',
    fontSize: 14,
    color: '#221C18',
  },
  resultsCount: {
    fontSize: 12,
    color: '#655B53',
    marginBottom: 14,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE7DE',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  giTagSmall: {
    backgroundColor: '#F3EADB',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  giTagSmallText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#701D24',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#221C18',
  },
  productRegion: {
    fontSize: 11,
    color: '#655B53',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#221C18',
  },
  productActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  smallStoryBtn: {
    backgroundColor: '#F3EADB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smallStoryBtnText: {
    color: '#701D24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  smallAddBtn: {
    backgroundColor: '#701D24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smallAddBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  storyHero: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6DFD5',
  },
  storyHeroHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#221C18',
    marginBottom: 6,
  },
  storyHeroDesc: {
    fontSize: 13,
    color: '#655B53',
    lineHeight: 18,
  },
  storyCardItem: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 14,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EDE7DE',
  },
  storyThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  storyCardDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  storyCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#221C18',
  },
  storyCardSubtitle: {
    fontSize: 11,
    color: '#701D24',
    fontWeight: '600',
  },
  storyCardPreview: {
    fontSize: 11,
    color: '#655B53',
    lineHeight: 15,
  },
  readMoreText: {
    fontSize: 11,
    color: '#C59B4B',
    fontWeight: 'bold',
    marginTop: 4,
  },
  cartHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#221C18',
    marginBottom: 14,
  },
  emptyCartBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE7DE',
  },
  emptyCartEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#221C18',
    marginBottom: 6,
  },
  emptyCartDesc: {
    fontSize: 13,
    color: '#655B53',
    textAlign: 'center',
    marginBottom: 20,
  },
  cartItemRow: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE7DE',
  },
  cartThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#221C18',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#701D24',
    marginTop: 2,
  },
  cartItemArtisan: {
    fontSize: 11,
    color: '#655B53',
  },
  removeBtn: {
    padding: 8,
  },
  removeBtnText: {
    color: '#9C8E82',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutBox: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EDE7DE',
  },
  fairWageAssurance: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  assuranceText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#655B53',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#701D24',
  },
  checkoutBtn: {
    backgroundColor: '#701D24',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomNav: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E6DFD5',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navActive: {
    transform: [{ scale: 1.15 }],
  },
  navLabel: {
    fontSize: 11,
    color: '#655B53',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#701D24',
    fontWeight: 'bold',
  },
  cartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#701D24',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCategory: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#C59B4B',
  },
  modalClose: {
    fontSize: 18,
    color: '#655B53',
    fontWeight: 'bold',
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#221C18',
    marginBottom: 4,
  },
  modalRegion: {
    fontSize: 13,
    color: '#655B53',
    marginBottom: 2,
  },
  modalArtisan: {
    fontSize: 13,
    color: '#701D24',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  storyBodyBox: {
    backgroundColor: '#FAF7F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE7DE',
    marginBottom: 20,
  },
  storyBodyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#221C18',
    marginBottom: 8,
  },
  storyBodyText: {
    fontSize: 13,
    color: '#423832',
    lineHeight: 20,
  },
  modalCta: {
    backgroundColor: '#701D24',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCtaText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
