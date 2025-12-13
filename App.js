import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';

const spots = [
  // --- צפון ---
  { id: '1', name: 'חוף סוקולוב, נהריה', lat: 33.0055, lng: 35.0818 },
  { id: '2', name: 'חוף ארגמן, עכו', lat: 32.9221, lng: 35.0719 },
  { id: '3', name: 'חוף סירונית, נתניה', lat: 32.3294, lng: 34.8437 },
  { id: '4', name: 'חוף אכדיה, הרצליה', lat: 32.1624, lng: 34.7957 },
  // --- מרכז ---
  { id: '5', name: 'החוף המערבי, ת"א', lat: 32.0645, lng: 34.7630 },
  { id: '6', name: 'חוף תאיו, בת ים', lat: 32.0163, lng: 34.7394 },
  { id: '7', name: 'חוף ראשון לציון', lat: 31.9710, lng: 34.7225 },
  // --- דרום ---
  { id: '8', name: 'חוף הקשתות, אשדוד', lat: 31.7915, lng: 34.6300 },
  { id: '9', name: 'חוף דלילה, אשקלון', lat: 31.6692, lng: 34.5539 }
];

const getWeatherIcon = (code) => {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code >= 95) return '⛈️';
  if (code >= 61) return '🌧️';
  return '☁️';
};

const getDayName = (dateString) => {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const d = new Date(dateString);
  return days[d.getDay()];
};

export default function App() {
  const [selectedSpot, setSelectedSpot] = useState(spots[4]); 
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeatherData = async (latitude, longitude) => {
    setLoading(true);
    setWeather(null);
    try {
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_direction,wind_wave_height&daily=wave_height_max&timezone=auto`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

      const [marineRes, weatherRes] = await Promise.all([fetch(marineUrl), fetch(weatherUrl)]);
      const marineData = await marineRes.json();
      const weatherData = await weatherRes.json();

      const dailyForecast = marineData.daily.time.map((time, index) => {
        return {
          date: time,
          dayName: getDayName(time),
          waveHeight: marineData.daily.wave_height_max[index] || 0, 
          weatherCode: weatherData.daily.weather_code[index],
          maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
          minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
        };
      });

      const currentWave = marineData.current.wave_height !== undefined ? marineData.current.wave_height : 0;
      const currentWind = marineData.current.wind_wave_height !== undefined ? Math.round(marineData.current.wind_wave_height * 10) : 0;

      setWeather({
        waveHeight: currentWave,
        waveDirection: marineData.current.wave_direction || 0,
        windSpeed: currentWind,
        temp: Math.round(weatherData.current.temperature_2m),
        conditionIcon: getWeatherIcon(weatherData.current.weather_code),
        daily: dailyForecast
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData(selectedSpot.lat, selectedSpot.lng);
  }, [selectedSpot]);

  const getWaveColor = (height) => {
    if (height < 0.6) return '#4da6ff'; 
    if (height > 1.8) return '#003366'; 
    return '#0066cc'; 
  };

  const getRecommendation = (height) => {
    if (height < 0.6) return { text: '😴 ים פלטה... קח סאפ', color: '#ff9900' };
    if (height > 1.8) return { text: '⚠️ גבוה ומסוכן! למקצוענים', color: '#cc0000' };
    return { text: '🏄‍♂️ תנאים מעולים! רוץ למים', color: '#009933' };
  };

  return (
    // SafeAreaView - דואג שלא נגלוש לתוך ה-Notch באייפון
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>🏄 SurfCheck Israel</Text>
        </View>

        {/* List of Spots */}
        <View style={styles.listContainer}>
          <FlatList
            horizontal
            data={spots}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.btn, selectedSpot.id === item.id ? styles.activeBtn : null]} 
                onPress={() => setSelectedSpot(item)}
              >
                <Text style={[styles.btnText, selectedSpot.id === item.id ? styles.activeBtnText : null]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {loading || !weather ? (
            <View style={{ marginTop: 50 }}>
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={{ textAlign: 'center', marginTop: 10 }}>טוען נתונים מהחוף...</Text>
            </View>
          ) : (
            <>
              <View style={[styles.recCard, { borderColor: getRecommendation(weather.waveHeight).color }]}>
                <Text style={[styles.recText, { color: getRecommendation(weather.waveHeight).color }]}>
                  {getRecommendation(weather.waveHeight).text}
                </Text>
              </View>

              <View style={[styles.mainCard, { backgroundColor: getWaveColor(weather.waveHeight) }]}>
                <Text style={styles.spotName}>{selectedSpot.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <Text style={styles.bigData}>{weather.waveHeight}</Text>
                  <Text style={{ color: 'white', fontSize: 20, marginBottom: 25 }}>m</Text>
                </View>
                <View style={styles.row}>
                  <View style={styles.statItem}>
                    <View style={{ transform: [{ rotate: `${weather.waveDirection}deg` }] }}>
                      <Text style={{ fontSize: 30 }}>⬆️</Text>
                    </View>
                    <Text style={styles.statValue}>{weather.windSpeed} קמ"ש</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={{ fontSize: 35 }}>{weather.conditionIcon}</Text>
                    <Text style={styles.statValue}>{weather.temp}°</Text>
                    <Text style={styles.statLabel}>בחוץ</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>📅 תחזית לשבוע הקרוב</Text>
              
              {weather.daily.map((day, index) => (
                <View key={index} style={styles.forecastRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: 90 }}>
                      <Text style={styles.dayName}>{index === 0 ? 'היום' : day.dayName}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 22, marginRight: 8 }}>{getWeatherIcon(day.weatherCode)}</Text>
                      <Text style={styles.tempRange}>{day.minTemp}°-{day.maxTemp}°</Text>
                  </View>
                  <View>
                      <Text style={styles.waveText}>🌊 {day.waveHeight}m</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 1. התאמה קריטית למובייל:
  // ב-Android אנחנו מוסיפים ידנית את הגובה של הסטטוס בר.
  // ב-iOS ה-SafeAreaView כבר מטפל בזה.
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  
  header: { 
    paddingVertical: 15, // הקטנו קצת כי יש עכשיו Safe Area
    backgroundColor: 'white', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#0066cc' },
  
  listContainer: { marginTop: 15, height: 50 },
  btn: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 5, borderRadius: 25, justifyContent: 'center', height: 40, borderWidth: 1, borderColor: '#ddd' },
  activeBtn: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  btnText: { fontWeight: '600', color: '#555' },
  activeBtnText: { color: 'white' },
  
  content: { padding: 20 },
  
  recCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 2, alignItems: 'center', elevation: 2 },
  recText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  mainCard: { borderRadius: 20, padding: 30, alignItems: 'center', elevation: 5, marginBottom: 30 },
  spotName: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  bigData: { color: 'white', fontSize: 70, fontWeight: 'bold', lineHeight: 75 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  statLabel: { color: 'white', fontSize: 14, opacity: 0.8 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'right' },
  forecastRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  dayName: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  tempRange: { color: '#666', fontSize: 14 },
  waveText: { fontWeight: 'bold', color: '#0066cc', fontSize: 16 }
});
