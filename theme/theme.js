// src/theme/theme.js
import { StyleSheet } from 'react-native';

// 🎨 COLORS
export const COLORS = {
  primary: '#8B4513',
  secondary: '#A0522D',
  accent: '#FFF8DC',
  text: '#4B2E05',
  border: '#D2B48C',
  searchBg: '#FFF',
  cardBg: '#FFF0DC',
  white: '#FFFFFF',
  danger: '#FF4C4C',
  kpiFirst: '#cd4009ff',
  kpiSecond: '#FF9800',
  kpithird: '#933e05ff',
  kpifourth: 'red',
  kpififth: 'green',
  kpisixth: 'grey',
  kpiseventh: 'yellow',

  //dfdldkdk
  kpibase: '#005BEA',
  kpibaseg: '#00C6FB',
  kpitotal: '#43e97b',
  kpitotalg: '#38f9d7',
  kpitotalpaid: '#4cd137',
  kpitotalpaidg: '#44bd32',

  kpitopay: '#ff6a6a',
  kpitopayg: '#ff9a9e',
  kpiadvance: '#4cd137',
  kpiadvanceg: '#44bd32',
  kpiextra: '#f7971e',
  kpiextrag: '#ffd200',
  kpiyes: '#4cd137',
  kpiyesg: '#44bd32',
  kpino: '#ff6a6a',
  kpinog: '#ff9a9e',


  cardGradientStart: '#f8fafc',
  cardGradientEnd: '#eef2ff',
  kpitotalpending: '#eab308',
  kpitotalpaid: '#16a34a',


};

// 🖋 FONT SIZES
export const SIZE = {
  sizes: {
    small: 12,
    medium: 14,
    md: 16,
    large: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

// 🧭 FONT STYLES (Strings only)
export const FONTS = {
  poppinsRegular: 'Poppins-Regular',
  poppinsBold: 'Poppins-Bold',
  montserratRegular: 'Montserrat-Regular',
  montserratBold: 'Montserrat-Bold',
};

// 🌟 GLOBAL STYLES
export const GLOBAL_STYLES = StyleSheet.create({
  // CONTAINER
  container: {
    flex: 1,
    backgroundColor: COLORS.accent,
  },

  // HEADER
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  headerText: {
    fontSize: SIZE.sizes.xxl,
    color: COLORS.white,
    fontFamily: FONTS.montserratBold,
    textAlign: 'center',
    backgroundColor: COLORS.primary,
  },

  // SEARCH BAR
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    margin: 10,
    backgroundColor: COLORS.searchBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,

    fontSize: SIZE.sizes.md,
    color: COLORS.text,
    fontFamily: FONTS.montserratRegular,
  },

  // ITEM BOXES
  itemBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.cardBg,
    marginBottom: 8,
    borderRadius: 10,
  },
  itemText: {
    fontSize: SIZE.sizes.xxl,
    color: COLORS.primary,
    fontFamily: FONTS.poppinsBold,
  },
  kpiRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',

    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 10, // modern RN (>=0.71)
  },

  kpiBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderTopWidth: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: 'center',
    width: '30%',
    elevation: 3,
  },


  squareBoxSmall: {
    backgroundColor: COLORS.cardBg,
    padding: 15,
    margin: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 105,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  kpiLabel: {
    fontSize: SIZE.sizes.md,
    color: COLORS.text,
    textAlign: 'center',
    fontFamily: FONTS.poppinsRegular,
    textTransform: 'uppercase'
  },
  kpiValue: {
    fontSize: SIZE.sizes.large,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
    fontFamily: FONTS.montserratRegular,
  },

  // BUTTONS
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  headerbutton: {
    // marginHorizontal:10,
    paddingHorizontal: 11,
    color: COLORS.white,
    borderRadius: 25

  },
  cancelbutton: {
    backgroundColor: COLORS.border,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,

    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZE.sizes.md,
    fontFamily: FONTS.poppinsBold,
  },
  cancelbuttonText: {
    color: COLORS.primary,
    fontSize: SIZE.sizes.md,
    fontFamily: FONTS.poppinsBold,
  },

  inputmodal: {
    backgroundColor: COLORS.accent,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  // PAGINATION
  pageButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  pageText: {
    fontSize: SIZE.sizes.md,
    color: COLORS.white,
    fontFamily: FONTS.poppinsBold,
  },

  // SECTION TITLES
  sectionTitle: {
    fontSize: SIZE.sizes.xl,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.text,
    marginVertical: 8,
    marginLeft: 10,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50%',
  },
  modalBox: {
    width: '85%',
    backgroundColor: COLORS.accent,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: SIZE.sizes.xl,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
 inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 6,
    position: 'relative', // needed for legend positioning
  },

  input: {
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 1,
    fontSize: SIZE.sizes.md,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    fontFamily: FONTS.montserratRegular,
    flex: 1, // fill remaining space
  },
    legendContainer: {
    backgroundColor: COLORS.white,
    width:"auto",
    paddingHorizontal:5,
  },

  legendText: {
    fontSize: SIZE.sizes.sm,
    fontWeight: 'bold',
    fontFamily:FONTS.poppinsBold,
    color: COLORS.primary,
  },
  // FLATLIST ITEM
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItem: {
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listItemText: {
    fontSize: SIZE.sizes.large,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.primary,
  },
  listItemSmallText: {
    fontSize: SIZE.sizes.small,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.primary,
  },

  listprice: {
    fontSize: SIZE.sizes.xxl,
    fontFamily: FONTS.montserratBold,
    color: COLORS.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  subContainer: {
    paddingHorizontal: 10,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 6,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  kpiHeader: {

    marginBottom: 10,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 10,
    borderRadius: 5
  },

  kpiHeaderText: {
    fontSize: SIZE.sizes.md,
    fontFamily: FONTS.montserratBold,
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: '',
  },

});
