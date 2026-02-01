import { StyleSheet, Text, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchProducts() {
  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Ionicons name="search-outline" style={styles.searchIcon} size={22} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Search by name or category..."
        />
      </View>
      <View style={styles.noProducts}>
        <Ionicons name="search" size={90} color="#E0E0E0" />
        <Text style={styles.noProductsText}>No products found</Text>
        <Text style={styles.tryDifferentText}>Try a different search term</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    noProducts: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -50
    },
    noProductsText: {
        marginTop: 20,
        fontSize: 18,
        color: 'gray'
    },
    tryDifferentText: {
        marginTop: 5,
        fontSize: 14,
        color: 'darkgray'
    }
});