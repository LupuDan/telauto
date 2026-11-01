-- seed.sql: starting data. Safe to run several times (existing rows are kept).

-- Categories (plan, section 1)
insert into public.categories (id, slug, name_ro, name_ru, sort_order) values
  (1, 'telefoane', 'Telefoane mobile', 'Мобильные телефоны', 1),
  (2, 'accesorii-telefoane', 'Accesorii pentru telefoane', 'Аксессуары для телефонов', 2),
  (3, 'autovehicule', 'Autovehicule', 'Автомобили', 3),
  (4, 'piese-auto', 'Piese auto', 'Автозапчасти', 4)
on conflict (id) do nothing;

-- Municipalities and districts of the Republic of Moldova
insert into public.localities (id, name_ro, name_ru, sort_order) values
  (1, 'Chișinău', 'Кишинёв', 1),
  (2, 'Bălți', 'Бельцы', 2),
  (3, 'Anenii Noi', 'Анений Ной', 10),
  (4, 'Basarabeasca', 'Басарабяска', 10),
  (5, 'Briceni', 'Бричаны', 10),
  (6, 'Cahul', 'Кагул', 10),
  (7, 'Cantemir', 'Кантемир', 10),
  (8, 'Călărași', 'Кэлэрашь', 10),
  (9, 'Căușeni', 'Каушаны', 10),
  (10, 'Cimișlia', 'Чимишлия', 10),
  (11, 'Criuleni', 'Криуляны', 10),
  (12, 'Dondușeni', 'Дондюшаны', 10),
  (13, 'Drochia', 'Дрокия', 10),
  (14, 'Dubăsari', 'Дубэсарь', 10),
  (15, 'Edineț', 'Единец', 10),
  (16, 'Fălești', 'Фэлешть', 10),
  (17, 'Florești', 'Флорешть', 10),
  (18, 'Glodeni', 'Глодяны', 10),
  (19, 'Hîncești', 'Хынчешть', 10),
  (20, 'Ialoveni', 'Яловены', 10),
  (21, 'Leova', 'Леова', 10),
  (22, 'Nisporeni', 'Ниспорены', 10),
  (23, 'Ocnița', 'Окница', 10),
  (24, 'Orhei', 'Орхей', 10),
  (25, 'Rezina', 'Резина', 10),
  (26, 'Rîșcani', 'Рышканы', 10),
  (27, 'Sîngerei', 'Сынджерей', 10),
  (28, 'Soroca', 'Сорока', 10),
  (29, 'Strășeni', 'Стрэшень', 10),
  (30, 'Șoldănești', 'Шолдэнешть', 10),
  (31, 'Ștefan Vodă', 'Штефан-Водэ', 10),
  (32, 'Taraclia', 'Тараклия', 10),
  (33, 'Telenești', 'Теленешть', 10),
  (34, 'Ungheni', 'Унгены', 10),
  (35, 'UTA Găgăuzia', 'АТО Гагаузия', 20),
  (36, 'Bender', 'Бендеры', 30),
  (37, 'Tiraspol', 'Тирасполь', 30),
  (38, 'Stânga Nistrului (alte localități)', 'Левобережье Днестра (другие)', 31)
on conflict (id) do nothing;

-- Phone brands ("Altele" = other, always last)
insert into public.phone_brands (name, sort_order) values
  ('Apple', 1), ('Samsung', 2), ('Xiaomi', 3), ('Huawei', 4), ('Honor', 5), ('Google', 6),
  ('OnePlus', 7), ('Motorola', 8), ('Nokia', 9), ('Realme', 10), ('Oppo', 11), ('Altele', 999)
on conflict (name) do nothing;

-- Vehicle makes and models common in Moldova (admins can add more later)
with data (make, models) as (
  values
    ('Audi', array['A3', 'A4', 'A5', 'A6', 'A8', 'Q3', 'Q5', 'Q7']),
    ('BMW', array['Seria 1', 'Seria 3', 'Seria 5', 'Seria 7', 'X1', 'X3', 'X5', 'X6']),
    ('Chevrolet', array['Aveo', 'Captiva', 'Cruze', 'Lacetti', 'Malibu', 'Volt']),
    ('Citroën', array['Berlingo', 'C3', 'C4', 'C5', 'Jumpy']),
    ('Dacia', array['Dokker', 'Duster', 'Lodgy', 'Logan', 'Sandero', 'Spring']),
    ('Fiat', array['500', 'Doblo', 'Ducato', 'Punto', 'Tipo']),
    ('Ford', array['C-Max', 'Fiesta', 'Focus', 'Fusion', 'Galaxy', 'Kuga', 'Mondeo', 'Transit']),
    ('GAZ', array['Gazelle', 'Volga']),
    ('Honda', array['Accord', 'Civic', 'CR-V', 'HR-V', 'Jazz']),
    ('Hyundai', array['Accent', 'Elantra', 'i30', 'Ioniq', 'Kona', 'Santa Fe', 'Sonata', 'Tucson']),
    ('Infiniti', array['FX', 'Q50', 'QX70']),
    ('Iveco', array['Daily']),
    ('Jeep', array['Cherokee', 'Compass', 'Grand Cherokee', 'Wrangler']),
    ('Kia', array['Ceed', 'K5', 'Niro', 'Optima', 'Rio', 'Sorento', 'Sportage']),
    ('Lada (VAZ)', array['2106', '2107', 'Granta', 'Kalina', 'Niva', 'Priora', 'Vesta']),
    ('Land Rover', array['Discovery', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport']),
    ('Lexus', array['ES', 'GX', 'IS', 'NX', 'RX']),
    ('Mazda', array['2', '3', '6', 'CX-3', 'CX-5']),
    ('Mercedes-Benz', array['A-Class', 'B-Class', 'C-Class', 'E-Class', 'GLC', 'GLE', 'ML', 'S-Class', 'Sprinter', 'Vito']),
    ('Mitsubishi', array['ASX', 'L200', 'Lancer', 'Outlander', 'Pajero']),
    ('Nissan', array['Almera', 'Juke', 'Leaf', 'Note', 'Primera', 'Qashqai', 'X-Trail']),
    ('Opel', array['Astra', 'Combo', 'Corsa', 'Insignia', 'Meriva', 'Vectra', 'Vivaro', 'Zafira']),
    ('Peugeot', array['206', '308', '407', '508', '3008', 'Partner']),
    ('Porsche', array['Cayenne', 'Macan', 'Panamera']),
    ('Renault', array['Clio', 'Fluence', 'Grand Scenic', 'Kangoo', 'Laguna', 'Megane', 'Scenic', 'Trafic']),
    ('Seat', array['Altea', 'Ibiza', 'Leon', 'Toledo']),
    ('Skoda', array['Fabia', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Superb']),
    ('Subaru', array['Forester', 'Impreza', 'Legacy', 'Outback', 'XV']),
    ('Suzuki', array['Jimny', 'Swift', 'SX4', 'Vitara']),
    ('Tesla', array['Model 3', 'Model S', 'Model X', 'Model Y']),
    ('Toyota', array['Auris', 'Avensis', 'Camry', 'C-HR', 'Corolla', 'Highlander', 'Land Cruiser', 'Prius', 'RAV4', 'Yaris']),
    ('Volkswagen', array['Caddy', 'Golf', 'Jetta', 'Passat', 'Polo', 'Sharan', 'Tiguan', 'Touareg', 'Touran', 'Transporter']),
    ('Volvo', array['S60', 'S80', 'V70', 'XC60', 'XC90'])
),
inserted_makes as (
  insert into public.vehicle_makes (name)
  select make from data
  on conflict (name) do nothing
  returning id, name
),
all_makes as (
  select id, name from inserted_makes
  union
  select m.id, m.name from public.vehicle_makes m join data d on d.make = m.name
)
insert into public.vehicle_models (make_id, name)
select am.id, unnest(d.models)
from data d
join all_makes am on am.name = d.make
on conflict (make_id, name) do nothing;

-- Phone models (starting list, newest first; admins can add more). Added in 0012.
with data (brand, models) as (
  values
    ('Apple', array['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17', 'iPhone 16e',
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone SE (2022)', 'iPhone SE (2020)',
      'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X', 'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7']),
    ('Samsung', array['Galaxy S26 Ultra', 'Galaxy S26+', 'Galaxy S26', 'Galaxy Z Fold7', 'Galaxy Z Flip7',
      'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy S25 FE', 'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S24 FE',
      'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE', 'Galaxy S22 Ultra', 'Galaxy S22', 'Galaxy S21', 'Galaxy S20',
      'Galaxy Z Fold6', 'Galaxy Z Flip6', 'Galaxy Z Fold5', 'Galaxy Z Flip5',
      'Galaxy A56', 'Galaxy A55', 'Galaxy A54', 'Galaxy A36', 'Galaxy A35', 'Galaxy A34', 'Galaxy A26', 'Galaxy A25',
      'Galaxy A16', 'Galaxy A15', 'Galaxy A14', 'Galaxy A06', 'Galaxy A05s', 'Galaxy M35', 'Galaxy Note 20 Ultra']),
    ('Xiaomi', array['Xiaomi 15T Pro', 'Xiaomi 15T', 'Xiaomi 15 Ultra', 'Xiaomi 15', 'Xiaomi 14T Pro', 'Xiaomi 14T', 'Xiaomi 14', 'Xiaomi 13T', 'Xiaomi 13',
      'Redmi Note 15 Pro+', 'Redmi Note 15 Pro', 'Redmi Note 15', 'Redmi Note 14 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14',
      'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12', 'Redmi 15', 'Redmi 14C', 'Redmi 13', 'Redmi 13C', 'Redmi A3',
      'POCO F7 Pro', 'POCO F7', 'POCO X7 Pro', 'POCO X7', 'POCO F6', 'POCO X6 Pro', 'POCO M6 Pro']),
    ('Huawei', array['Pura 80 Pro', 'Pura 70 Pro', 'Pura 70', 'Mate X6', 'Mate 60 Pro', 'P60 Pro', 'P50 Pro', 'P40 Pro', 'P30 Pro', 'P30 Lite',
      'nova 13', 'nova 12', 'nova 11', 'Y90', 'Y70']),
    ('Honor', array['Magic7 Pro', 'Magic7 Lite', 'Magic6 Pro', 'Magic6 Lite', 'Honor 400 Pro', 'Honor 400', 'Honor 200 Pro', 'Honor 200',
      'Honor 90', 'X9c', 'X9b', 'X8b', 'X7c', 'X6b']),
    ('Google', array['Pixel 10 Pro XL', 'Pixel 10 Pro', 'Pixel 10', 'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 9a',
      'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a']),
    ('OnePlus', array['OnePlus 13', 'OnePlus 13R', 'OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 10 Pro',
      'Nord 5', 'Nord 4', 'Nord CE4', 'Nord CE4 Lite', 'Nord 3']),
    ('Motorola', array['Edge 60 Pro', 'Edge 60', 'Edge 50 Pro', 'Edge 50', 'razr 60 ultra', 'razr 50 ultra', 'razr 50',
      'moto g85', 'moto g75', 'moto g55', 'moto g54', 'moto g35', 'moto g24', 'moto e14']),
    ('Nokia', array['G42', 'G22', 'G21', 'C32', 'C22', 'X30', 'XR21', '3310', '105', '110']),
    ('Realme', array['GT 7 Pro', 'GT 7', 'GT 6', '14 Pro+', '14 Pro', '13 Pro+', '13 Pro', '12 Pro+', '12', 'C75', 'C67', 'C65', 'C55', 'Note 60']),
    ('Oppo', array['Find X8 Pro', 'Find X8', 'Reno14 Pro', 'Reno14', 'Reno13 Pro', 'Reno13', 'Reno12 Pro', 'Reno12',
      'A80', 'A79', 'A60', 'A40', 'A18'])
)
insert into public.phone_models (brand_id, name, sort_order)
select b.id, m.name, m.ord::smallint
from data d
join public.phone_brands b on b.name = d.brand
cross join lateral unnest(d.models) with ordinality as m(name, ord)
on conflict (brand_id, name) do nothing;
