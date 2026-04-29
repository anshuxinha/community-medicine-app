import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const DropdownPicker = ({ selectedValue, onValueChange, items, labelExtractor, valueExtractor, style }) => {
    const [visible, setVisible] = useState(false);

    const handleSelect = (item) => {
        onValueChange(valueExtractor ? valueExtractor(item) : item.value);
        setVisible(false);
    };

    const selectedItem = items.find(item => 
        (valueExtractor ? valueExtractor(item) : item.value) === selectedValue
    );
    
    let displayLabel = "Select an option";
    if (selectedItem) {
        displayLabel = labelExtractor ? labelExtractor(selectedItem) : selectedItem.label;
    }

    return (
        <>
            <TouchableOpacity 
                activeOpacity={0.7} 
                style={[styles.dropdownButton, style]} 
                onPress={() => setVisible(true)}
            >
                <Text style={styles.dropdownText} numberOfLines={1}>{displayLabel}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={() => setVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Option</Text>
                            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                                <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Divider />
                        <FlatList
                            data={items}
                            keyExtractor={(item, index) => String(valueExtractor ? valueExtractor(item) : item.value) + '-' + index}
                            renderItem={({ item }) => {
                                const val = valueExtractor ? valueExtractor(item) : item.value;
                                const lab = labelExtractor ? labelExtractor(item) : item.label;
                                const isSelected = val === selectedValue;
                                return (
                                    <TouchableOpacity 
                                        style={[styles.optionItem, isSelected && styles.optionItemSelected]} 
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{lab}</Text>
                                        {isSelected && <MaterialIcons name="check" size={20} color={theme.colors.primary} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 4,
        backgroundColor: theme.colors.surfacePrimary,
        marginTop: 8,
    },
    dropdownText: {
        fontSize: 14,
        color: theme.colors.textTitle,
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 12,
        width: '100%',
        maxHeight: '80%',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textTitle,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceSecondary,
    },
    optionItemSelected: {
        backgroundColor: theme.colors.primaryLight,
    },
    optionText: {
        fontSize: 16,
        color: theme.colors.textTitle,
        flex: 1,
    },
    optionTextSelected: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
});

export default DropdownPicker;
