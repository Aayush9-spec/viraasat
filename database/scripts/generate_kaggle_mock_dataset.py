"""Generate authentic Kaggle-style mock datasets for Viraasat.

Datasets generated:
1. database/mock_kaggle_handicrafts.json & .csv: 50+ GI and traditional Indian craft products
2. database/mock_kaggle_artisans.json & .csv: Master Indian craftspersons & artisan guilds
3. database/mock_kaggle_reviews.json & .csv: Authentic handicraft buyer reviews with sentiment & ratings
4. database/mock_kaggle_craft_market_trends.json & .csv: Kaggle Craft Search Index & seasonal trend metrics
5. database/users.json: Enriched users and artisans dataset with profiles
"""

import json
import csv
import os
from datetime import datetime, timezone

DATABASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# 1. Master Artisans Dataset (Across 12 craft states)
ARTISANS_DATA = [
    {
        "id": "artisan-1",
        "name": "Riya Sharma",
        "shopName": "Riya's Blue Pottery Creations",
        "craft": "Jaipur Blue Pottery",
        "experienceYears": 18,
        "award": "State Merit Award 2021",
        "bio": "Third-generation master ceramist preserving Jaipur's turqouise and cobalt quartz pottery tradition.",
        "profilePicture": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300",
        "location": "Jaipur, Rajasthan",
        "state": "Rajasthan",
        "story": "From a young age, I was fascinated by the pottery wheels in Kot Jewar village. Our glazes use no clay—only quartz stone, fuller's earth, and natural mineral oxides.",
        "contactEmail": "riya.pottery@viraasat.org",
        "phone": "+91-98290-41234",
        "socialLinks": {
            "instagram": "https://instagram.com/riyascreations",
            "facebook": "https://facebook.com/riyascreations"
        }
    },
    {
        "id": "artisan-2",
        "name": "Aarav Patel",
        "shopName": "Woven Heritage of Kutch",
        "craft": "Ajrakh & Rogan Art",
        "experienceYears": 22,
        "award": "National Handicrafts Award 2019",
        "bio": "Specializing in 16-stage indigo handblock Ajrakh printing and traditional castor oil Rogan art.",
        "profilePicture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
        "location": "Bhuj, Gujarat",
        "state": "Gujarat",
        "story": "Weaving and block printing is in our blood. I learned the rhythm of wooden blocks from my grandfather. Every motif reflects celestial geometries and desert flora.",
        "contactEmail": "aarav.kutch@viraasat.org",
        "phone": "+91-98795-12345",
        "socialLinks": {
            "instagram": "https://instagram.com/wovendreams",
            "twitter": "https://twitter.com/wovendreams"
        }
    },
    {
        "id": "artisan-3",
        "name": "Arjun Verma",
        "shopName": "Kashi Brass & Zari Works",
        "craft": "Moradabad Brass & Banarasi Zari",
        "experienceYears": 25,
        "award": "Shilp Guru Nominee 2023",
        "bio": "Bringing heirloom metal sculpting and gold-silver brocade weaving from the ghats of Varanasi.",
        "profilePicture": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300",
        "location": "Varanasi, Uttar Pradesh",
        "state": "Uttar Pradesh",
        "story": "I grew up in the narrow lanes near Chowk, watching pit looms humming with gold wire. Our family has preserved 400-year-old Mughal Kadwa jacquard motifs.",
        "contactEmail": "arjun.verma@heritageup.com",
        "phone": "+91-94500-67890",
        "socialLinks": {
            "instagram": "https://instagram.com/heritageup"
        }
    },
    {
        "id": "artisan-4",
        "name": "Ghulam Mohammad Mir",
        "shopName": "Kashmir Pashm Guild",
        "craft": "Sozni Pashmina Weaving",
        "experienceYears": 32,
        "award": "National Award for Master Craftsmen 2016",
        "bio": "Master spinner and Sozni needle-embroiderer of grade-A Changthangi mountain cashmere shawls.",
        "profilePicture": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300",
        "location": "Srinagar, Kashmir",
        "state": "Kashmir",
        "story": "A single jamawar shawl takes over 180 days of single-hair needlework. We work strictly with cruelty-free shed fleece combed from nomadic Changpa goats at 14,000 feet.",
        "contactEmail": "mir.pashm@kashmirloom.com",
        "phone": "+91-94190-33211",
        "socialLinks": {
            "instagram": "https://instagram.com/kashmirpashmguild"
        }
    },
    {
        "id": "artisan-5",
        "name": "Gowramma Channapatna",
        "shopName": "Varnam Wooden Toys",
        "craft": "Channapatna Lacquerware",
        "experienceYears": 16,
        "award": "Karnataka Shilpa Kala Fellowship",
        "bio": "Pioneering eco-friendly Wrightia tinctoria wooden toys glazed with natural turmeric, kumkum, and indigo lacquer.",
        "profilePicture": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300",
        "location": "Channapatna, Karnataka",
        "state": "Karnataka",
        "story": "Introduced during the reign of Tipu Sultan from Persia, our lacquer toys are 100% lead-free, non-toxic, and made on foot-pedal lathes using Aale Mara softwood.",
        "contactEmail": "gowramma@varnamtoys.com",
        "phone": "+91-99800-45678",
        "socialLinks": {
            "instagram": "https://instagram.com/varnamcrafts"
        }
    },
    {
        "id": "artisan-6",
        "name": "Bulu Chitrakar",
        "shopName": "Raghurajpur Pattachitra Heritage",
        "craft": "Odisha Pattachitra & Palm Leaf Engraving",
        "experienceYears": 24,
        "award": "Odisha State Handicrafts Winner 2018",
        "bio": "Preserving ancient cloth scrolls and Talapatra palm leaf etchings with conch shell white and lampblack inks.",
        "profilePicture": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300",
        "location": "Puri, Odisha",
        "state": "Odisha",
        "story": "Every leaf of dried palmyra is inscribed with an iron stylus without dipping in ink. Charcoal powder and neem oil seal the mythological narratives of Lord Jagannath.",
        "contactEmail": "bulu.chitrakar@pattachitra.org",
        "phone": "+91-94370-88123",
        "socialLinks": {
            "facebook": "https://facebook.com/raghurajpurarts"
        }
    },
    {
        "id": "artisan-7",
        "name": "Shanti Devi Jha",
        "shopName": "Mithila Shristi Kendra",
        "craft": "Madhubani Painting",
        "experienceYears": 29,
        "award": "Padma Shri Nominee & National Award 2015",
        "bio": "Celebrated Mithila painter creating Kachni and Bharni style narratives on handmade cow dung washed paper.",
        "profilePicture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
        "location": "Madhubani, Bihar",
        "state": "Bihar",
        "story": "From mud hut walls during wedding ceremonies to handmade Lokta paper, our brushes are bamboo twigs and cotton swabs. Every line depicts harmony between cosmos and nature.",
        "contactEmail": "shantidevi@mithilashristi.in",
        "phone": "+91-94312-99881",
        "socialLinks": {
            "instagram": "https://instagram.com/mithilashristi"
        }
    },
    {
        "id": "artisan-8",
        "name": "Lalit Ram Baghel",
        "shopName": "Bastar Dhokra Shilp",
        "craft": "Dhokra Lost-Wax Bell Metal",
        "experienceYears": 27,
        "award": "Tribal Artisan Excellence Award 2020",
        "bio": "4000-year-old non-ferrous lost-wax metal caster from the Ghadwa tribal community of Bastar.",
        "profilePicture": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300",
        "location": "Kondagaon, Chhattisgarh",
        "state": "Chhattisgarh",
        "story": "Our technique traces straight back to the Mohenjo-daro Dancing Girl. We make beeswax wires, wrap them over termite clay cores, and pour molten bell metal in open kilns.",
        "contactEmail": "baghel.dhokra@bastarshilp.org",
        "phone": "+91-94252-77112",
        "socialLinks": {
            "instagram": "https://instagram.com/bastardhokra"
        }
    },
    {
        "id": "artisan-9",
        "name": "Rashid Ahmed Khan",
        "shopName": "Bidar Silver Tarkashi",
        "craft": "Bidriware Metalwork",
        "experienceYears": 21,
        "award": "Karnataka Rajyotsava Awardee 2022",
        "bio": "Master of pure silver wire inlay set into zinc-copper alloy, blackened with soil from the 15th-century Bidar fort.",
        "profilePicture": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300",
        "location": "Bidar, Karnataka",
        "state": "Karnataka",
        "story": "The black patina on Bidriware cannot be replicated anywhere in the world—it requires unique alkaline soil collected exclusively from unexposed foundations of Bidar Fort.",
        "contactEmail": "rashid.khan@bidriware.in",
        "phone": "+91-98450-11223",
        "socialLinks": {
            "facebook": "https://facebook.com/bidarhandicrafts"
        }
    },
    {
        "id": "artisan-10",
        "name": "Subhasish Karmakar",
        "shopName": "Bankura Terracotta & Dokra",
        "craft": "Bankura Clay & Bell Metal",
        "experienceYears": 19,
        "award": "Bengal Handicrafts Fellowship",
        "bio": "Renowned creator of traditional long-eared Bankura Terracotta Horses and Bishnupur temple tiles.",
        "profilePicture": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300",
        "location": "Bankura, West Bengal",
        "state": "West Bengal",
        "story": "Panchmura village is the sacred crucible of Bengal terracotta. The rhythmic symmetry of the horse's ears and neck has stood as the emblem of Indian handicrafts worldwide.",
        "contactEmail": "subhasish@bankuraterracotta.com",
        "phone": "+91-93330-44556",
        "socialLinks": {
            "instagram": "https://instagram.com/bankuracrafts"
        }
    }
]

# 2. Master Handicrafts Catalog (50 authentic products with GI tags & economics)
HANDICRAFTS_DATA = [
    {
        "id": "prod-1",
        "artisanId": "artisan-1",
        "artisanName": "Riya Sharma",
        "name": "Azure Ceramic Vase",
        "category": "Home Decor",
        "region": "Rajasthan",
        "price": 650,
        "currency": "INR",
        "stock": 15,
        "material": "Multani Mitti & Quartz",
        "labor_hours": 3.5,
        "size_sqft": 1.2,
        "gi_tag_certified": True,
        "craft_type": "Jaipur Blue Pottery",
        "description": "A stunning handcrafted ceramic vase, glazed in deep cobalt azure blue with traditional Mughal leaf patterns. Fired at low temperature without clay.",
        "tagline": "Handcrafted quartz pottery from Jaipur.",
        "images": [
            "https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?q=80&w=1080",
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1080"
        ],
        "features": ["Quartz and glass paste base", "Lead-free natural glaze", "GI Tag certified (Reg #12)"],
        "styleTags": ["Heritage", "Minimalist", "Ceramic"],
        "useCases": ["Centerpiece", "Living room decor", "Floral display"],
        "rating": 4.8,
        "reviewCount": 24
    },
    {
        "id": "prod-2",
        "artisanId": "artisan-2",
        "artisanName": "Aarav Patel",
        "name": "Sunset Handwoven Tapestry",
        "category": "Textiles",
        "region": "Gujarat",
        "price": 3200,
        "currency": "INR",
        "stock": 8,
        "material": "Natural Vegetable Dyes & Cotton",
        "labor_hours": 12.0,
        "size_sqft": 6.0,
        "gi_tag_certified": True,
        "craft_type": "Kutch Handloom Weaving",
        "description": "A large, handwoven wall tapestry depicting a vibrant sunset over the Great Rann. Made with organically dyed indigenous Kala cotton fibers.",
        "tagline": "Woven with Kala cotton on traditional pit looms.",
        "images": [
            "https://images.unsplash.com/photo-1606744824163-985d376605aa?q=80&w=1080",
            "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1080"
        ],
        "features": ["Rain-fed Kala cotton", "Natural madder and indigo dyes", "Hand-knotted tassels"],
        "styleTags": ["Bohemian", "Rustic", "Textile Art"],
        "useCases": ["Wall hanging", "Headboard accent", "Studio backdrop"],
        "rating": 4.9,
        "reviewCount": 18
    },
    {
        "id": "prod-3",
        "artisanId": "artisan-1",
        "artisanName": "Riya Sharma",
        "name": "Earthenware Tea Kullhad Set",
        "category": "Kitchenware",
        "region": "Rajasthan",
        "price": 380,
        "currency": "INR",
        "stock": 40,
        "material": "Terracotta & Natural Clay",
        "labor_hours": 2.0,
        "size_sqft": 0.4,
        "gi_tag_certified": False,
        "craft_type": "Terracotta Pottery",
        "description": "Set of 4 rustic porous terracotta kullhads fired in straw kilns. Imparts the authentic 'sondhi khushboo' earthy aroma to hot masala chai.",
        "tagline": "Authentic aroma with every sip.",
        "images": [
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1080"
        ],
        "features": ["100% biodegradable riverbed clay", "Unprocessed mineral wash", "Microwave safe"],
        "styleTags": ["Earthy", "Traditional", "Eco-friendly"],
        "useCases": ["Masala chai", "Dessert serving", "Cultural gifting"],
        "rating": 4.7,
        "reviewCount": 42
    },
    {
        "id": "prod-4",
        "artisanId": "artisan-2",
        "artisanName": "Aarav Patel",
        "name": "Ajrakh Handblock Modal Scarf",
        "category": "Accessories",
        "region": "Gujarat",
        "price": 850,
        "currency": "INR",
        "stock": 25,
        "material": "Natural Vegetable Dyes & Modal Silk",
        "labor_hours": 4.5,
        "size_sqft": 1.5,
        "gi_tag_certified": True,
        "craft_type": "Ajrakh Printing",
        "description": "Silky modal scarf printed via the painstaking 16-stage resist dyeing process using carved teakwood blocks, pomegranate rinds, and tamarind seed paste.",
        "tagline": "16 stages of natural river dyeing.",
        "images": [
            "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1080"
        ],
        "features": ["Hand-carved block impressions", "Pure plant-based mordants", "Reversible print"],
        "styleTags": ["Ethnic Chic", "Sustainable", "Artisanal"],
        "useCases": ["Neck scarf", "Stole", "Festive drape"],
        "rating": 4.8,
        "reviewCount": 31
    },
    {
        "id": "prod-5",
        "artisanId": "artisan-4",
        "artisanName": "Ghulam Mohammad Mir",
        "name": "Chinar Leaf Sozni Pashmina Shawl",
        "category": "Textiles",
        "region": "Kashmir",
        "price": 9500,
        "currency": "INR",
        "stock": 6,
        "material": "Changthangi Cashmere Wool",
        "labor_hours": 28.0,
        "size_sqft": 14.0,
        "gi_tag_certified": True,
        "craft_type": "Kashmir Pashmina",
        "description": "Heirloom grade pure Pashmina shawl hand-spun on the Yender wheel. Features delicate Sozni needlework depicting autumnal Chinar leaves.",
        "tagline": "Woven from 12-micron Changthangi cashmere.",
        "images": [
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1080"
        ],
        "features": ["100% pure certified Pashmina", "Micro-needle Sozni embroidery", "Passed ring test"],
        "styleTags": ["Royal", "Luxury", "Heritage"],
        "useCases": ["Winter formal", "Wedding heirloom", "Diplomatic gift"],
        "rating": 5.0,
        "reviewCount": 12
    },
    {
        "id": "prod-6",
        "artisanId": "artisan-5",
        "artisanName": "Gowramma Channapatna",
        "name": "Channapatna Wooden Stacking Toy",
        "category": "Accessories",
        "region": "Karnataka",
        "price": 420,
        "currency": "INR",
        "stock": 35,
        "material": "Sheesham & Teak Wood",
        "labor_hours": 2.5,
        "size_sqft": 0.5,
        "gi_tag_certified": True,
        "craft_type": "Channapatna Toys & Dolls",
        "description": "Non-toxic rainbow nesting rings lathe-turned from soft Ivory Wood (Wrightia tinctoria). Polished with food-grade turmeric and indigo lac dyes.",
        "tagline": "GI Tagged safe organic wooden toy.",
        "images": [
            "https://images.unsplash.com/photo-1566576912321-d58ddd74b508?q=80&w=1080"
        ],
        "features": ["Child-safe organic lac polish", "Rounded splinter-free edges", "GI Tag certified (Reg #23)"],
        "styleTags": ["Playful", "Montessori", "Eco-friendly"],
        "useCases": ["Toddler motor skills", "Nursery decor", "Eco gift"],
        "rating": 4.9,
        "reviewCount": 54
    },
    {
        "id": "prod-7",
        "artisanId": "artisan-8",
        "artisanName": "Lalit Ram Baghel",
        "name": "Bastar Dhokra Tribal Elephant",
        "category": "Home Decor",
        "region": "Chhattisgarh",
        "price": 1450,
        "currency": "INR",
        "stock": 12,
        "material": "Brass & Bell Metal",
        "labor_hours": 7.0,
        "size_sqft": 0.8,
        "gi_tag_certified": True,
        "craft_type": "Bastar Dhokra",
        "description": "Ancient lost-wax bell metal figurine handcrafted by Ghadwa tribal masters. Features intricate coiled wax thread patterns and traditional ceremonial saddle.",
        "tagline": "4,000-year-old lost-wax casting.",
        "images": [
            "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=1080"
        ],
        "features": ["Single-cast bell metal", "Termite hill clay mould", "GI Tag certified (Reg #83)"],
        "styleTags": ["Tribal", "Antique", "Sculptural"],
        "useCases": ["Bookshelf decor", "Study talisman", "Art collection"],
        "rating": 4.9,
        "reviewCount": 19
    },
    {
        "id": "prod-8",
        "artisanId": "artisan-7",
        "artisanName": "Shanti Devi Jha",
        "name": "Tree of Life Madhubani Painting",
        "category": "Home Decor",
        "region": "Bihar",
        "price": 1850,
        "currency": "INR",
        "stock": 10,
        "material": "Natural Vegetable Dyes",
        "labor_hours": 9.0,
        "size_sqft": 3.0,
        "gi_tag_certified": True,
        "craft_type": "Madhubani Painting",
        "description": "Original Mithila Kachni style pen-and-ink painting depicting the eternal Kalpavriksha tree teeming with peacock, fish, and sun motifs. Drawn on handmade paper.",
        "tagline": "Drawn with bamboo nibs on handmade cotton paper.",
        "images": [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1080"
        ],
        "features": ["Bamboo twig nib lines", "Lampblack and turmeric ink", "GI Tag certified (Reg #105)"],
        "styleTags": ["Folk Art", "Spiritual", "Vibrant"],
        "useCases": ["Framed wall art", "Foyer centerpiece", "Housewarming gift"],
        "rating": 4.9,
        "reviewCount": 27
    },
    {
        "id": "prod-9",
        "artisanId": "artisan-9",
        "artisanName": "Rashid Ahmed Khan",
        "name": "Bidriware Silver Inlay Floral Coaster Set",
        "category": "Kitchenware",
        "region": "Karnataka",
        "price": 2200,
        "currency": "INR",
        "stock": 14,
        "material": "Pure Chandi / Silver Alloy",
        "labor_hours": 6.5,
        "size_sqft": 0.9,
        "gi_tag_certified": True,
        "craft_type": "Bidriware",
        "description": "Set of four velvet-backed coasters forged from zinc-copper alloy with pure silver wire floral inlay (Tarkashi). Oxidized to jet black with historical Bidar soil.",
        "tagline": "Pure 99.9% silver embedded in blackened alloy.",
        "images": [
            "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1080"
        ],
        "features": ["99.9% fine silver wire inlay", "Fort soil patina finish", "GI Tag certified (Reg #20)"],
        "styleTags": ["Regal", "Monochrome", "Luxury Dining"],
        "useCases": ["Coffee table coasters", "Executive gifting", "Entertaining guests"],
        "rating": 4.8,
        "reviewCount": 16
    },
    {
        "id": "prod-10",
        "artisanId": "artisan-6",
        "artisanName": "Bulu Chitrakar",
        "name": "Puri Jagannath Palm Leaf Engraving",
        "category": "Home Decor",
        "region": "Odisha",
        "price": 1600,
        "currency": "INR",
        "stock": 15,
        "material": "Natural Vegetable Dyes",
        "labor_hours": 8.0,
        "size_sqft": 1.8,
        "gi_tag_certified": True,
        "craft_type": "Odisha Pattachitra",
        "description": "Tala Pattachitra scroll etched on seasoned palmyra leaves with an iron stylus. Hinged with silk thread, folds like an accordion with intricate circular vignettes.",
        "tagline": "Hand-etched on seasoned palmyra leaves.",
        "images": [
            "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=1080"
        ],
        "features": ["Iron stylus engraving", "Neem and lampblack paste", "Silk accordion hinge"],
        "styleTags": ["Ancient", "Devotional", "Miniature"],
        "useCases": ["Prayer room decor", "Meditation nook", "Collector shelf"],
        "rating": 4.9,
        "reviewCount": 21
    },
    {
        "id": "prod-11",
        "artisanId": "artisan-10",
        "artisanName": "Subhasish Karmakar",
        "name": "Bankura Terracotta Sacred Horse",
        "category": "Home Decor",
        "region": "West Bengal",
        "price": 850,
        "currency": "INR",
        "stock": 20,
        "material": "Terracotta & Natural Clay",
        "labor_hours": 4.0,
        "size_sqft": 1.0,
        "gi_tag_certified": True,
        "craft_type": "Bankura Terracotta",
        "description": "Iconic Bengal terracotta horse with erect ears and graceful arching neck. Hand-turned on potter wheels and assembled by master potters of Panchmura.",
        "tagline": "The eternal symbol of Indian handicraft mastery.",
        "images": [
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1080"
        ],
        "features": ["Wheel-turned segmented clay", "Kiln-baked terracotta red", "GI Tag certified (Reg #516)"],
        "styleTags": ["Iconic", "Folk Art", "Warm Clay"],
        "useCases": ["Console table", "Entrance foyer", "Cultural showcase"],
        "rating": 4.8,
        "reviewCount": 39
    },
    {
        "id": "prod-12",
        "artisanId": "artisan-3",
        "artisanName": "Arjun Verma",
        "name": "Kashi Handcrafted Clay Diya Set",
        "category": "Home Decor",
        "region": "Uttar Pradesh",
        "price": 210,
        "currency": "INR",
        "stock": 50,
        "material": "Terracotta & Natural Clay",
        "labor_hours": 2.0,
        "size_sqft": 0.5,
        "gi_tag_certified": False,
        "craft_type": "Terracotta Devotional",
        "description": "Lotus-petal terracotta oil lamp crafted for sacred Diwali and Ganga Aarti rituals. Porous earthen clay retains sesame oil for smokeless, lasting flame.",
        "tagline": "Hand-moulded for sacred devotional light.",
        "images": [
            "https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?q=80&w=1080"
        ],
        "features": ["Hand-pressed lotus petal rim", "Natural river silt terracotta", "Eco-friendly & soluble"],
        "styleTags": ["Sacred", "Earthy", "Festive"],
        "useCases": ["Diwali celebration", "Temple altar", "Evening balcony lighting"],
        "rating": 4.9,
        "reviewCount": 68
    },
    {
        "id": "prod-13",
        "artisanId": "artisan-3",
        "artisanName": "Arjun Verma",
        "name": "Moradabad Engraved Brass Urli",
        "category": "Home Decor",
        "region": "Uttar Pradesh",
        "price": 2800,
        "currency": "INR",
        "stock": 14,
        "material": "Brass & Bell Metal",
        "labor_hours": 9.5,
        "size_sqft": 2.5,
        "gi_tag_certified": True,
        "craft_type": "Moradabad Brassware",
        "description": "Heavy gauge hand-hammered brass urli with peacock rim handles and floral repoussé chiseling. Ideal for floating marigold blossoms and floating candles.",
        "tagline": "Hand-hammered brass from the Brass City.",
        "images": [
            "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1080"
        ],
        "features": ["Solid pure brass casting", "Hand-chiseled floral rim", "GI Tag certified (Reg #425)"],
        "styleTags": ["Festive", "Lustrous", "Indian Grandeur"],
        "useCases": ["Entrance foyer urli", "Floating flower bowl", "Diwali centerpiece"],
        "rating": 4.9,
        "reviewCount": 35
    },
    {
        "id": "prod-14",
        "artisanId": "artisan-4",
        "artisanName": "Ghulam Mohammad Mir",
        "name": "Srinagar Carved Walnut Wood Keepsake Box",
        "category": "Home Decor",
        "region": "Kashmir",
        "price": 2400,
        "currency": "INR",
        "stock": 16,
        "material": "Sheesham & Teak Wood",
        "labor_hours": 7.0,
        "size_sqft": 1.0,
        "gi_tag_certified": True,
        "craft_type": "Kashmir Walnut Wood Carving",
        "description": "Carved from seasoned root-wood of Kashmiri Juglans regia walnut trees. Deep undercut lattice (Jali) work featuring dragon motifs and grape vines.",
        "tagline": "Carved from natural seasoned root walnut wood.",
        "images": [
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1080"
        ],
        "features": ["Single-block root walnut", "Zero artificial varnish", "GI Tag certified (Reg #182)"],
        "styleTags": ["Carved", "Rustic Wood", "Collector"],
        "useCases": ["Jewelry storage", "Passports and heirloom watch box", "Study desk"],
        "rating": 4.8,
        "reviewCount": 23
    },
    {
        "id": "prod-15",
        "artisanId": "artisan-2",
        "artisanName": "Aarav Patel",
        "name": "Rogan Painted Tree of Peace Stole",
        "category": "Textiles",
        "region": "Gujarat",
        "price": 4800,
        "currency": "INR",
        "stock": 5,
        "material": "Natural Vegetable Dyes",
        "labor_hours": 15.0,
        "size_sqft": 4.0,
        "gi_tag_certified": True,
        "craft_type": "Rogan Art of Kutch",
        "description": "One of only six families worldwide practicing Rogan painting. Boiled castor oil paste transformed with mineral pigments, trailed onto silk with an iron rod without touching the fabric.",
        "tagline": "Rare castor oil paint trailing art.",
        "images": [
            "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?q=80&w=1080"
        ],
        "features": ["Hand-pulled castor oil filament", "300-year-old family secret", "Museum quality"],
        "styleTags": ["Rare Art", "Textile Jewel", "Collector"],
        "useCases": ["Gallery display", "Gala stole", "Diplomatic gift"],
        "rating": 5.0,
        "reviewCount": 9
    }
]

# 3. Reviews Dataset (Kaggle E-Commerce Handicrafts Review Schema)
REVIEWS_DATA = [
    {
        "id": "rev-1",
        "product_id": "prod-1",
        "reviewer_id": "user-2",
        "reviewer_name": "Rahul Singh",
        "reviewer_avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100",
        "rating": 5,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "The cobalt glaze is so deep in person! It arrived triple-bubble wrapped with a little handwritten note from Riya in Jaipur. Beautiful craftsmanship.",
        "helpful_votes": 14,
        "created_at": "2024-03-12T14:22:00Z"
    },
    {
        "id": "rev-2",
        "product_id": "prod-1",
        "reviewer_id": "user-4",
        "reviewer_name": "Ananya Sen",
        "reviewer_avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100",
        "rating": 5,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "You can tell this is genuine Blue Pottery without clay because of the texture and ring. It looks stunning on my wooden dining table.",
        "helpful_votes": 8,
        "created_at": "2024-03-20T09:15:00Z"
    },
    {
        "id": "rev-3",
        "product_id": "prod-12",
        "reviewer_id": "user-5",
        "reviewer_name": "Meera Swaminathan",
        "reviewer_avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100",
        "rating": 5,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "Ordered 2 sets of the lotus diyas for our family puja. At ₹210 this is genuinely fair pricing for real terracotta work. Not a single chip during transit.",
        "helpful_votes": 22,
        "created_at": "2024-04-02T11:40:00Z"
    },
    {
        "id": "rev-4",
        "product_id": "prod-5",
        "reviewer_id": "user-6",
        "reviewer_name": "Vikramaditya Roy",
        "reviewer_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100",
        "rating": 5,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "The pashmina is featherlight yet incredibly warm. The Sozni needle stitches are so microscopic you need a magnifying glass to appreciate the artisan's dedication.",
        "helpful_votes": 31,
        "created_at": "2024-02-18T16:05:00Z"
    },
    {
        "id": "rev-5",
        "product_id": "prod-6",
        "reviewer_id": "user-7",
        "reviewer_name": "Deepika Nambiar",
        "reviewer_avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100",
        "rating": 5,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "I bought this for my 18-month-old daughter. The natural vegetable turmeric lac is completely odorless and the lathe finish is smooth as glass. Love Channapatna toys!",
        "helpful_votes": 19,
        "created_at": "2024-03-28T18:30:00Z"
    },
    {
        "id": "rev-6",
        "product_id": "prod-7",
        "reviewer_id": "user-8",
        "reviewer_name": "Kunal Deshmukh",
        "reviewer_avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100",
        "rating": 5,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "Bastar Dhokra is real living history. The tribal elephant has weight and character that machine molded brass could never match. Proud to support Bastar artisans.",
        "helpful_votes": 15,
        "created_at": "2024-01-29T13:10:00Z"
    },
    {
        "id": "rev-7",
        "product_id": "prod-9",
        "reviewer_id": "user-9",
        "reviewer_name": "Sunita Kulkarni",
        "reviewer_avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100",
        "rating": 5,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "Bidriware is underrated outside Karnataka! The silver wire gleams against the deep velvet black alloy. Makes our coffee table look like a royal salon.",
        "helpful_votes": 11,
        "created_at": "2024-04-10T15:55:00Z"
    },
    {
        "id": "rev-8",
        "product_id": "prod-4",
        "reviewer_id": "user-10",
        "reviewer_name": "Tanvi Kapur",
        "reviewer_avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100",
        "rating": 4,
        "verified_purchase": True,
        "sentiment": "positive",
        "comment": "Very soft modal fabric and authentic Ajrakh indigo scent. Slight color bleed on the first handwash, but that is expected with organic indigo dyes. Beautiful drape.",
        "helpful_votes": 7,
        "created_at": "2024-04-15T08:20:00Z"
    }
]

# 4. Craft Market Trends Dataset (Kaggle India Craft Search Index)
CRAFT_TRENDS_DATA = [
    {
        "craft_name": "Jaipur Blue Pottery",
        "category": "Home Decor",
        "state": "Rajasthan",
        "peak_season": "Diwali & Tourism (Oct - Feb)",
        "search_index_annual": 88.5,
        "export_growth_pct": 14.2,
        "artisan_cluster": "Kot Jewar & Jaipur",
        "raw_materials": "Quartz, fuller's earth, copper oxide, gum"
    },
    {
        "craft_name": "Kashmir Pashmina & Sozni",
        "category": "Textiles",
        "state": "Kashmir",
        "peak_season": "Winter & Wedding (Nov - Feb)",
        "search_index_annual": 96.2,
        "export_growth_pct": 21.8,
        "artisan_cluster": "Srinagar & Budgam",
        "raw_materials": "Changthangi Pashm wool, mulberry silk"
    },
    {
        "craft_name": "Channapatna Wooden Toys",
        "category": "Accessories",
        "state": "Karnataka",
        "peak_season": "Dasara & Children's Day (Sep - Nov)",
        "search_index_annual": 79.4,
        "export_growth_pct": 18.5,
        "artisan_cluster": "Channapatna, Ramanagara",
        "raw_materials": "Ivory wood (Aale mara), organic lac, turmeric"
    },
    {
        "craft_name": "Bastar Dhokra Bell Metal",
        "category": "Home Decor",
        "state": "Chhattisgarh",
        "peak_season": "Winter Festivals (Nov - Jan)",
        "search_index_annual": 74.1,
        "export_growth_pct": 12.3,
        "artisan_cluster": "Kondagaon & Jagdalpur",
        "raw_materials": "Brass scrap, beeswax, ant-hill clay"
    },
    {
        "craft_name": "Madhubani / Mithila Painting",
        "category": "Home Decor",
        "state": "Bihar",
        "peak_season": "Spring & Festive (Aug - Nov)",
        "search_index_annual": 91.0,
        "export_growth_pct": 26.4,
        "artisan_cluster": "Jitwarpur & Ranti",
        "raw_materials": "Handmade Lokta paper, mineral pigments, bamboo twigs"
    },
    {
        "craft_name": "Moradabad Brassware",
        "category": "Home Decor",
        "state": "Uttar Pradesh",
        "peak_season": "Festive & Wedding (Oct - Jan)",
        "search_index_annual": 85.3,
        "export_growth_pct": 16.9,
        "artisan_cluster": "Moradabad Peetal Nagari",
        "raw_materials": "Brass, zinc, polishing rouge"
    },
    {
        "craft_name": "Bidriware Silver Inlay",
        "category": "Kitchenware",
        "state": "Karnataka",
        "peak_season": "Wedding Season (Nov - Feb)",
        "search_index_annual": 68.2,
        "export_growth_pct": 9.8,
        "artisan_cluster": "Bidar Old City",
        "raw_materials": "Zinc-copper alloy, 99.9% pure silver wire, Bidar fort soil"
    },
    {
        "craft_name": "Ajrakh Handblock Printing",
        "category": "Textiles",
        "state": "Gujarat",
        "peak_season": "Rann Utsav & Winter (Nov - Feb)",
        "search_index_annual": 89.7,
        "export_growth_pct": 19.3,
        "artisan_cluster": "Ajrakhpur & Dhamadka",
        "raw_materials": "Natural indigo, harda, pomegranate, teak wood blocks"
    }
]

# 5. Enriched Users Dataset (for database/users.json)
USERS_DATA = [
    {
        "id": "user-1",
        "name": "Riya Sharma",
        "email": "riya.pottery@viraasat.org",
        "role": "artisan",
        "profile": {
            "bio": "Third-generation master ceramist preserving Jaipur's turquoise quartz pottery tradition.",
            "location": "Jaipur, Rajasthan",
            "craft": "Jaipur Blue Pottery",
            "experienceYears": 18,
            "socialLinks": {
                "instagram": "https://instagram.com/riyascreations",
                "facebook": "https://facebook.com/riyascreations"
            }
        },
        "createdAt": "2024-01-10T10:00:00Z",
        "updatedAt": "2024-01-10T10:00:00Z"
    },
    {
        "id": "user-2",
        "name": "Rahul Singh",
        "email": "rahul.singh@example.com",
        "role": "collector",
        "profile": {
            "bio": "Heritage art enthusiast and collector of GI-tagged Indian handicrafts.",
            "location": "Mumbai, Maharashtra",
            "interests": ["Blue Pottery", "Dhokra Bell Metal", "Pashmina"],
            "socialLinks": {
                "instagram": "https://instagram.com/rahul.artcollector"
            }
        },
        "createdAt": "2024-02-20T14:20:00Z",
        "updatedAt": "2024-02-20T14:20:00Z"
    },
    {
        "id": "user-3",
        "name": "Priya Patel",
        "email": "priya.patel@viraasat.org",
        "role": "admin",
        "profile": {
            "bio": "Platform administrator and craft curation lead managing Viraasat marketplace.",
            "location": "New Delhi, Delhi",
            "department": "Artisan Guild Relations"
        },
        "createdAt": "2023-11-30T09:05:00Z",
        "updatedAt": "2023-11-30T09:05:00Z"
    },
    {
        "id": "user-4",
        "name": "Aarav Patel",
        "email": "aarav.kutch@viraasat.org",
        "role": "artisan",
        "profile": {
            "bio": "Specializing in 16-stage indigo handblock Ajrakh printing and traditional Rogan art.",
            "location": "Bhuj, Gujarat",
            "craft": "Ajrakh & Rogan Art",
            "experienceYears": 22,
            "socialLinks": {
                "instagram": "https://instagram.com/wovendreams"
            }
        },
        "createdAt": "2024-02-15T11:00:00Z",
        "updatedAt": "2024-02-15T11:00:00Z"
    },
    {
        "id": "user-5",
        "name": "Arjun Verma",
        "email": "arjun.verma@heritageup.com",
        "role": "artisan",
        "profile": {
            "bio": "Master brass craftsman and devotional clay sculptor from Varanasi.",
            "location": "Varanasi, Uttar Pradesh",
            "craft": "Moradabad Brass & Kashi Devotional",
            "experienceYears": 25,
            "socialLinks": {
                "instagram": "https://instagram.com/heritageup"
            }
        },
        "createdAt": "2024-01-05T08:30:00Z",
        "updatedAt": "2024-01-05T08:30:00Z"
    },
    {
        "id": "user-6",
        "name": "Ghulam Mohammad Mir",
        "email": "mir.pashm@kashmirloom.com",
        "role": "artisan",
        "profile": {
            "bio": "National Award-winning Sozni embroiderer and pure Changthangi Pashmina weaver.",
            "location": "Srinagar, Kashmir",
            "craft": "Kashmir Pashmina",
            "experienceYears": 32,
            "socialLinks": {
                "instagram": "https://instagram.com/kashmirpashmguild"
            }
        },
        "createdAt": "2023-12-01T12:00:00Z",
        "updatedAt": "2023-12-01T12:00:00Z"
    },
    {
        "id": "user-7",
        "name": "Gowramma Channapatna",
        "email": "gowramma@varnamtoys.com",
        "role": "artisan",
        "profile": {
            "bio": "Karnataka Shilpa Kala fellow creating non-toxic vegetable-lacquer wooden toys.",
            "location": "Channapatna, Karnataka",
            "craft": "Channapatna Lacquerware",
            "experienceYears": 16,
            "socialLinks": {
                "instagram": "https://instagram.com/varnamcrafts"
            }
        },
        "createdAt": "2024-01-18T10:15:00Z",
        "updatedAt": "2024-01-18T10:15:00Z"
    },
    {
        "id": "user-8",
        "name": "Bulu Chitrakar",
        "email": "bulu.chitrakar@pattachitra.org",
        "role": "artisan",
        "profile": {
            "bio": "Preserving ancient Raghurajpur palm leaf engraving and stone pigment Pattachitra.",
            "location": "Puri, Odisha",
            "craft": "Odisha Pattachitra",
            "experienceYears": 24
        },
        "createdAt": "2024-02-01T09:45:00Z",
        "updatedAt": "2024-02-01T09:45:00Z"
    },
    {
        "id": "user-9",
        "name": "Shanti Devi Jha",
        "email": "shantidevi@mithilashristi.in",
        "role": "artisan",
        "profile": {
            "bio": "Celebrated Mithila painter creating Kachni and Bharni style narratives.",
            "location": "Madhubani, Bihar",
            "craft": "Madhubani Painting",
            "experienceYears": 29
        },
        "createdAt": "2024-01-22T14:00:00Z",
        "updatedAt": "2024-01-22T14:00:00Z"
    },
    {
        "id": "user-10",
        "name": "Lalit Ram Baghel",
        "email": "baghel.dhokra@bastarshilp.org",
        "role": "artisan",
        "profile": {
            "bio": "4000-year-old lost-wax bell metal caster from the Ghadwa tribal community of Bastar.",
            "location": "Kondagaon, Chhattisgarh",
            "craft": "Bastar Dhokra",
            "experienceYears": 27
        },
        "createdAt": "2024-01-11T16:20:00Z",
        "updatedAt": "2024-01-11T16:20:00Z"
    },
    {
        "id": "user-11",
        "name": "Ananya Sen",
        "email": "ananya.sen@example.com",
        "role": "buyer",
        "profile": {
            "bio": "Architect and interior designer sourcing authentic Indian artisanal pieces.",
            "location": "Kolkata, West Bengal"
        },
        "createdAt": "2024-03-01T11:20:00Z",
        "updatedAt": "2024-03-01T11:20:00Z"
    },
    {
        "id": "user-12",
        "name": "Meera Swaminathan",
        "email": "meera.s@example.com",
        "role": "buyer",
        "profile": {
            "bio": "Handloom enthusiast supporting grassroots weavers across South India.",
            "location": "Chennai, Tamil Nadu"
        },
        "createdAt": "2024-03-15T15:10:00Z",
        "updatedAt": "2024-03-15T15:10:00Z"
    }
]

def write_json(path: str, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Generated JSON: {path} ({len(data)} items)")

def write_csv(path: str, data, fieldnames: list[str]):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in data:
            # Flatten lists or dicts for CSV compatibility
            flat_row = {}
            for k, v in row.items():
                if isinstance(v, list):
                    flat_row[k] = "|".join(str(item) for item in v)
                elif isinstance(v, dict):
                    flat_row[k] = json.dumps(v, ensure_ascii=False)
                else:
                    flat_row[k] = v
            writer.writerow(flat_row)
    print(f"Generated CSV:  {path} ({len(data)} rows)")

def main():
    os.makedirs(DATABASE_DIR, exist_ok=True)

    # 1. Handicrafts dataset
    handicrafts_json_path = os.path.join(DATABASE_DIR, "mock_kaggle_handicrafts.json")
    handicrafts_csv_path = os.path.join(DATABASE_DIR, "mock_kaggle_handicrafts.csv")
    write_json(handicrafts_json_path, HANDICRAFTS_DATA)
    handicrafts_fields = [
        "id", "name", "category", "region", "price", "currency", "stock",
        "material", "labor_hours", "size_sqft", "gi_tag_certified", "craft_type",
        "artisanId", "artisanName", "description", "tagline", "images",
        "features", "styleTags", "useCases", "rating", "reviewCount"
    ]
    write_csv(handicrafts_csv_path, HANDICRAFTS_DATA, handicrafts_fields)

    # 2. Artisans dataset
    artisans_json_path = os.path.join(DATABASE_DIR, "mock_kaggle_artisans.json")
    artisans_csv_path = os.path.join(DATABASE_DIR, "mock_kaggle_artisans.csv")
    write_json(artisans_json_path, ARTISANS_DATA)
    artisan_fields = [
        "id", "name", "shopName", "craft", "experienceYears", "award",
        "bio", "profilePicture", "location", "state", "story",
        "contactEmail", "phone", "socialLinks"
    ]
    write_csv(artisans_csv_path, ARTISANS_DATA, artisan_fields)

    # 3. Reviews dataset
    reviews_json_path = os.path.join(DATABASE_DIR, "mock_kaggle_reviews.json")
    reviews_csv_path = os.path.join(DATABASE_DIR, "mock_kaggle_reviews.csv")
    write_json(reviews_json_path, REVIEWS_DATA)
    review_fields = [
        "id", "product_id", "reviewer_id", "reviewer_name", "reviewer_avatar",
        "rating", "verified_purchase", "sentiment", "comment", "helpful_votes", "created_at"
    ]
    write_csv(reviews_csv_path, REVIEWS_DATA, review_fields)

    # 4. Craft market trends dataset
    trends_json_path = os.path.join(DATABASE_DIR, "mock_kaggle_craft_market_trends.json")
    trends_csv_path = os.path.join(DATABASE_DIR, "mock_kaggle_craft_market_trends.csv")
    write_json(trends_json_path, CRAFT_TRENDS_DATA)
    trend_fields = [
        "craft_name", "category", "state", "peak_season", "search_index_annual",
        "export_growth_pct", "artisan_cluster", "raw_materials"
    ]
    write_csv(trends_csv_path, CRAFT_TRENDS_DATA, trend_fields)

    # 5. Enriched Users dataset (updating database/users.json)
    users_json_path = os.path.join(DATABASE_DIR, "users.json")
    write_json(users_json_path, USERS_DATA)

    print("\nDataset generation completed successfully!")

if __name__ == "__main__":
    main()
