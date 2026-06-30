(function(){
  "use strict";
  var KEY = "veshannastro_shared_cart_v1";

  function read(){
    try{
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : {};
      if(!Array.isArray(data.items)) data.items = [];
      data.coupon = data.coupon || "";
      return data;
    }catch(e){
      return {items:[], coupon:""};
    }
  }

  function write(cart){
    cart = cart || {};
    cart.items = Array.isArray(cart.items) ? cart.items.filter(function(item){ return item && item.sku && item.qty > 0; }) : [];
    cart.coupon = cart.coupon || "";
    cart.updatedAt = new Date().toISOString();
    try{ localStorage.setItem(KEY, JSON.stringify(cart)); }catch(e){}
    return cart;
  }

  function normaliseItem(item){
    item = item || {};
    return {
      sku:String(item.sku || ""),
      name:String(item.name || "Bracelet"),
      qty:Math.max(1, Math.min(10, Number(item.qty || 1))),
      unit_price:Number(item.unit_price || item.price || 0),
      mrp:Number(item.mrp || 0),
      gemstones:String(item.gemstones || ""),
      image:String(item.image || ""),
      source:String(item.source || "")
    };
  }

  function add(item){
    item = normaliseItem(item);
    if(!item.sku) return read();
    var cart = read();
    var found = cart.items.find(function(row){ return row.sku === item.sku; });
    if(found){
      found.qty = Math.max(1, Math.min(10, Number(found.qty || 0) + item.qty));
      found.unit_price = item.unit_price || found.unit_price;
      found.name = item.name || found.name;
      found.mrp = item.mrp || found.mrp;
      found.gemstones = item.gemstones || found.gemstones;
      found.image = item.image || found.image;
      found.source = item.source || found.source;
    }else{
      cart.items.push(item);
    }
    return write(cart);
  }

  function setItems(items, coupon){
    return write({items:(items || []).map(normaliseItem), coupon:coupon || ""});
  }

  function setCoupon(coupon){
    var cart = read();
    cart.coupon = coupon || "";
    return write(cart);
  }

  function clear(){
    return write({items:[], coupon:""});
  }

  function count(cart){
    cart = cart || read();
    return cart.items.reduce(function(sum,item){ return sum + Number(item.qty || 0); }, 0);
  }

  function subtotal(cart){
    cart = cart || read();
    return cart.items.reduce(function(sum,item){ return sum + Number(item.unit_price || 0) * Number(item.qty || 0); }, 0);
  }

  function discount(cart){
    cart = cart || read();
    var sub = subtotal(cart);
    var code = String(cart.coupon || "").toUpperCase();
    var qty = count(cart);
    if((code === "PAIR10" || code === "HAPPY10") && qty >= 2) return Math.round(sub * 0.10);
    if(code === "MAAYA15" || code === "NEW15" || code === "WELCOME15" || code === "FIRSTBLESSING15") return Math.round(sub * 0.15);
    if(code === "COMEBACK25" || code === "KINDLYCOMEBACK25") return Math.min(25, sub);
    return 0;
  }

  function total(cart){
    cart = cart || read();
    return Math.max(0, subtotal(cart) - discount(cart));
  }

  window.VeshSharedCart = {key:KEY, read:read, write:write, add:add, setItems:setItems, setCoupon:setCoupon, clear:clear, count:count, subtotal:subtotal, discount:discount, total:total};
})();
