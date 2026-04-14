import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { Supplement } from '@/lib/types';

const TYPES = ['HRT', 'Bioidentical', 'Supplement', 'Medication', 'Other'];
const DELIVERY = ['Oral', 'Patch', 'Gel', 'Injection', 'Sublingual', 'Topical', 'Other'];
const FREQUENCY = ['Daily', 'Twice daily', 'Weekly', 'As needed', 'Other'];

const EMPTY_FORM = { name: '', type: 'Supplement', dose: '', delivery: 'Oral', frequency: 'Daily', brand: '' };

export default function SupplementsScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('supplements')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setSupplements(data ?? []);
  };

  useEffect(() => { load(); }, [profile]);

  const handleAdd = async () => {
    if (!profile || !form.name.trim() || saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await supabase.from('supplements').insert({
      user_id: profile.id,
      name: form.name.trim(),
      type: form.type,
      dose: form.dose.trim() || null,
      delivery: form.delivery,
      frequency: form.frequency,
      brand: form.brand.trim() || null,
      is_active: true,
      started_at: new Date().toISOString().split('T')[0],
    });

    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const toggleActive = async (s: Supplement) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const update = s.is_active
      ? { is_active: false, paused_at: new Date().toISOString() }
      : { is_active: true, paused_at: null };
    await supabase.from('supplements').update(update).eq('id', s.id);
    setSupplements((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...update } : x)));
  };

  const active = supplements.filter((s) => s.is_active);
  const paused = supplements.filter((s) => !s.is_active);

  return (
    <>
      <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Supplements & HRT</Text>
            <Text style={[Typography.muted, { color: theme.textMuted }]}>
              {active.length} active{paused.length > 0 ? `, ${paused.length} paused` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowForm(true)}
            accessibilityRole="button"
            accessibilityLabel="Add supplement"
          >
            <Text style={[styles.addButtonText, { fontFamily: 'Montserrat-Bold' }]}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {supplements.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[Typography.body, { color: theme.textMuted, textAlign: 'center' }]}>
              Nothing added yet. Tap + Add to log your HRT, supplements, or medications.
            </Text>
          </View>
        )}

        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 12 }]}>ACTIVE</Text>
            {active.map((s) => <SupplementRow key={s.id} supplement={s} theme={theme} onToggle={toggleActive} />)}
          </View>
        )}

        {paused.length > 0 && (
          <View style={[styles.section, { marginTop: 24 }]}>
            <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 12 }]}>PAUSED</Text>
            {paused.map((s) => <SupplementRow key={s.id} supplement={s} theme={theme} onToggle={toggleActive} />)}
          </View>
        )}
      </ScrollView>

      {/* Add supplement modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.modalContent}>
          <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 24 }]}>Add item</Text>

          <FormField label="NAME *">
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
              placeholder="e.g. Progesterone, Magnesium glycinate"
              placeholderTextColor={theme.textMuted}
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              autoFocus
            />
          </FormField>

          <FormField label="TYPE">
            <ChipSelector options={TYPES} selected={form.type} onSelect={(t) => setForm((f) => ({ ...f, type: t }))} theme={theme} />
          </FormField>

          <FormField label="DOSE (optional)">
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
              placeholder="e.g. 100mg, 1 patch, 2 pumps"
              placeholderTextColor={theme.textMuted}
              value={form.dose}
              onChangeText={(t) => setForm((f) => ({ ...f, dose: t }))}
            />
          </FormField>

          <FormField label="DELIVERY">
            <ChipSelector options={DELIVERY} selected={form.delivery} onSelect={(t) => setForm((f) => ({ ...f, delivery: t }))} theme={theme} />
          </FormField>

          <FormField label="FREQUENCY">
            <ChipSelector options={FREQUENCY} selected={form.frequency} onSelect={(t) => setForm((f) => ({ ...f, frequency: t }))} theme={theme} />
          </FormField>

          <FormField label="BRAND (optional)">
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
              placeholder="e.g. Utrogestan, Sanderson"
              placeholderTextColor={theme.textMuted}
              value={form.brand}
              onChangeText={(t) => setForm((f) => ({ ...f, brand: t }))}
            />
          </FormField>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }, (!form.name.trim() || saving) && styles.disabled]}
            onPress={handleAdd}
            disabled={!form.name.trim() || saving}
            accessibilityRole="button"
          >
            <Text style={[styles.saveText, { fontFamily: 'Montserrat-Bold' }]}>
              {saving ? 'Saving…' : 'Add item'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={() => { setShowForm(false); setForm(EMPTY_FORM); }}
            accessibilityRole="button"
          >
            <Text style={[Typography.body, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </>
  );
}

function SupplementRow({ supplement: s, theme, onToggle }: { supplement: Supplement; theme: any; onToggle: (s: Supplement) => void }) {
  return (
    <View style={[styles.supplementRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.supplementInfo}>
        <Text style={[Typography.cardTitle, { color: theme.textPrimary }]}>{s.name}</Text>
        <Text style={[Typography.muted, { color: theme.textMuted }]}>
          {[s.type, s.dose, s.delivery, s.frequency].filter(Boolean).join(' · ')}
        </Text>
        {s.brand && <Text style={[Typography.muted, { color: theme.textMuted }]}>{s.brand}</Text>}
      </View>
      <Switch
        value={s.is_active}
        onValueChange={() => onToggle(s)}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.formField}>
      <Text style={[Typography.label, { color: '#7A9A6A', marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
}

function ChipSelector({ options, selected, onSelect, theme }: { options: string[]; selected: string; onSelect: (v: string) => void; theme: any }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, { borderColor: selected === opt ? theme.primary : theme.border, backgroundColor: selected === opt ? theme.greenPale : theme.surface }]}
          onPress={() => onSelect(opt)}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === opt }}
        >
          <Text style={[Typography.label, { color: selected === opt ? theme.primary : theme.textMuted }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  modalContent: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  addButton: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 14 },
  section: {},
  emptyState: { borderWidth: 1, borderRadius: 12, padding: 24, alignItems: 'center' },
  supplementRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 10 },
  supplementInfo: { flex: 1, gap: 3 },
  formField: { marginBottom: 20 },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Lato-Regular', fontSize: 16, minHeight: 52 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  saveButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52, marginTop: 8 },
  cancelButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52, marginTop: 12 },
  disabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontSize: 16 },
});
