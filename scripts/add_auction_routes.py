router_path = 'backend/app/api/v1/router.py'
with open(router_path, 'r', encoding='utf-8') as f:
    content = f.read()

auction_code = '''

# ---- Unique Art & Heirloom Auctions ----

class CreateAuctionInput(BaseModel):
    title: str
    artisan_name: str = "Master Artisan Guild"
    artisan_region: str = "Varanasi, Uttar Pradesh"
    craft_category: str = "Handicraft & Heritage Weaves"
    min_price: float
    duration_hours: int = 72
    min_increment: float = 1000.0
    description: str = ""
    image_url: str = "/images/products/banarasi-silk.jpg"
    gi_tag_certified: bool = True
    seller_email: Optional[str] = None


class PlaceBidInput(BaseModel):
    bidder_name: str = "Verified Patron"
    amount: float


_AUCTIONS_CACHE = [
    {
        "id": "auction-zardozi-royal",
        "title": "Imperial 24K Gold Zardozi Wall Hanging (c. 1978 Royal Pattern)",
        "artisan_name": "Ustad Abdul Qadir & Sons",
        "artisan_region": "Varanasi, Uttar Pradesh",
        "craft_category": "Zardozi & Gold Metallic Embroidery",
        "gi_tag_certified": True,
        "provenance_hash": "0x8f4c91a0b3e2...7b2a",
        "description": "An irreplaceable museum-grade tapestry hand-stitched over 14 months using real 24-karat gold dipped silver wires (kalabattu) over pure velvet silk.",
        "image_url": "/images/products/zardozi-embroidery.jpg",
        "min_price": 85000.0,
        "current_bid": 114000.0,
        "bid_count": 16,
        "min_increment": 2500.0,
        "duration_hours": 120,
        "status": "active",
        "bids": [
            {"id": "b1", "bidder_name": "Maharaja Heritage Trust", "amount": 85000.0, "timestamp": "2 days ago"},
            {"id": "b2", "bidder_name": "Claire D., Louvre Arts Curator", "amount": 95000.0, "timestamp": "1 day ago"},
            {"id": "b3", "bidder_name": "National Textile Guild Patron", "amount": 114000.0, "timestamp": "2 hours ago"}
        ]
    },
    {
        "id": "auction-dhokra-shaman",
        "title": "Tribal Bastar Dhokra Dancing Shaman (Solid Bronze Lost-Wax Cast)",
        "artisan_name": "Sukhdev Baghel Guild",
        "artisan_region": "Bastar, Chhattisgarh",
        "craft_category": "Dhokra Non-Ferrous Lost-Wax Metal Casting",
        "gi_tag_certified": True,
        "provenance_hash": "0x3c7e44f810aa...e911",
        "description": "Cast using an unbroken 4,000-year-old metallurgical technique traced back to Mohenjo-daro.",
        "image_url": "/images/products/metal-sculpting.jpg",
        "min_price": 42000.0,
        "current_bid": 58500.0,
        "bid_count": 11,
        "min_increment": 1500.0,
        "duration_hours": 56,
        "status": "active",
        "bids": [
            {"id": "b5", "bidder_name": "Devika Singhania Arts", "amount": 42000.0, "timestamp": "1 day ago"},
            {"id": "b7", "bidder_name": "Tribal Arts Foundation Zurich", "amount": 58500.0, "timestamp": "4 hours ago"}
        ]
    }
]


@api_router.get("/auctions")
@_limiter.limit("60/minute")
async def list_auctions(request: Request):
    """
    List all active unique art auctions.
    """
    return {"status": "ok", "count": len(_AUCTIONS_CACHE), "auctions": _AUCTIONS_CACHE}


@api_router.post("/auctions")
@_limiter.limit("20/minute")
async def create_auction(
    request: Request,
    payload: CreateAuctionInput,
    user: Optional[dict] = Depends(get_optional_user),
):
    """
    Create a new unique art auction with reserve minimum price and auction duration.
    """
    if payload.min_price <= 0:
        raise HTTPException(status_code=400, detail="Minimum price must be greater than zero.")
    if payload.duration_hours <= 0:
        raise HTTPException(status_code=400, detail="Duration hours must be at least 1.")

    auction_id = f"auction-{int(datetime.utcnow().timestamp())}"
    new_auc = {
        "id": auction_id,
        "title": payload.title,
        "artisan_name": payload.artisan_name,
        "artisan_region": payload.artisan_region,
        "craft_category": payload.craft_category,
        "gi_tag_certified": payload.gi_tag_certified,
        "provenance_hash": f"0x{int(datetime.utcnow().timestamp()):x}...sha256",
        "description": payload.description,
        "image_url": payload.image_url,
        "min_price": float(payload.min_price),
        "current_bid": float(payload.min_price),
        "bid_count": 1,
        "min_increment": float(payload.min_increment),
        "duration_hours": payload.duration_hours,
        "status": "active",
        "seller_email": payload.seller_email,
        "bids": [
            {
                "id": f"bid-open-{int(datetime.utcnow().timestamp())}",
                "bidder_name": "Opening Reserve",
                "amount": float(payload.min_price),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        ]
    }
    _AUCTIONS_CACHE.insert(0, new_auc)
    return {"status": "created", "auction": new_auc}


@api_router.post("/auctions/{auction_id}/bid")
@_limiter.limit("30/minute")
async def place_auction_bid(
    request: Request,
    auction_id: str,
    payload: PlaceBidInput,
    user: Optional[dict] = Depends(get_optional_user),
):
    """
    Place a verified bid on an active unique art auction.
    """
    for auc in _AUCTIONS_CACHE:
        if auc["id"] == auction_id:
            min_required = auc["current_bid"] + auc["min_increment"]
            if payload.amount < min_required:
                raise HTTPException(
                    status_code=400,
                    detail=f"Bid must be at least {min_required} INR (current bid: {auc['current_bid']}, min increment: {auc['min_increment']})"
                )
            new_bid = {
                "id": f"bid-{int(datetime.utcnow().timestamp())}",
                "bidder_name": payload.bidder_name,
                "amount": float(payload.amount),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            auc["current_bid"] = float(payload.amount)
            auc["bid_count"] += 1
            auc["bids"].insert(0, new_bid)
            return {"status": "bid_accepted", "current_bid": auc["current_bid"], "bid_count": auc["bid_count"]}
    raise HTTPException(status_code=404, detail="Auction not found.")
'''

if 'CreateAuctionInput' not in content:
    content += auction_code
    with open(router_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Auctions routes added to router.py")
else:
    print("CreateAuctionInput already exists in router.py")
