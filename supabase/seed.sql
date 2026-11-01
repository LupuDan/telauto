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
