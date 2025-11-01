import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity } from "react-native";
import { VictoryPie } from "victory-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

export default function DonutKpi({
  data = [], // [{ label, value, color }]
  showTotal = true,
  isMoney = true,
  label = "",
  labelPosition = "both", // left | right | top | bottom | both
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState({ label: "", value: 0, color: "#fff" });

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const formatLabel = (v) => (isMoney ? `₹${Math.round(v)}` : Math.round(v));

  const handleSlicePress = (label, value, color) => {
    setSelectedSlice({ label, value, color });
    setModalVisible(true);
  };

  const donutRadius = screenWidth * 0.18; // small donut
  const donutThickness = 60;
  const containerHeight = donutRadius * 2 + 80;

  const centerX = screenWidth / 2;
  const centerY = donutRadius + 40;

  // slice angles for arrows
  let cumulative = 0;
  const sliceAngles = data.map((d) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 360;
    const midAngle = (startAngle + endAngle) / 2;
    return midAngle;
  });

  // label positions for both
  const labelPositions = sliceAngles.map((angle) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    const side = Math.cos(radians) >= 0 ? "right" : "left";
    const xOffset = side === "right" ? donutRadius + 80 : -(donutRadius + 80);
    const yOffset = donutRadius * Math.sin(radians);
    return { x: centerX + xOffset, y: centerY + yOffset, side };
  });

  const renderSideLabels = (side) => {
    const isLeft = side === "left";
    return (
      <View style={[styles.sideContainer, isLeft ? { marginRight: 12 } : { marginLeft: 12 }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.labelRow}>
            <View style={[styles.colorTag, { backgroundColor: d.color }]} />
            <Text style={styles.sideLabel}>{`${d.label}: ${formatLabel(d.value)}`}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {label !== "" && <Text style={styles.header}>{label}</Text>}

      <View style={[styles.chartRow, { height: containerHeight }]}>
        {labelPosition === "left" && renderSideLabels("left")}

        <View style={{ width: donutRadius * 2 + 80, height: containerHeight }}>
          <Svg width="100%" height={containerHeight}>
            <VictoryPie
              standalone={false}
              width={donutRadius * 2 + 80}
              height={containerHeight}
              innerRadius={donutRadius - donutThickness / 2}
              cornerRadius={5}
              padAngle={2}
              data={data.map((d) => ({ x: d.label, y: d.value }))}
              colorScale={data.map((d) => d.color)}
              animate={{ duration: 800 }}
              labels={() => null}
              events={[
                {
                  target: "data",
                  eventHandlers: {
                    onPressIn: (_, props) => {
                      const slice = props.datum.x;
                      const value = props.datum.y;
                      const color = data[props.index].color;
                      handleSlicePress(slice, value, color);
                    },
                  },
                },
              ]}
              style={{ data: { stroke: "#fff", strokeWidth: 1 } }}
            />

            {/* only arrows for both */}
            {labelPosition === "both" &&
              data.map((d, i) => (
                <React.Fragment key={i}>
                  <Line
                    x1={centerX + (donutRadius - 10) * Math.cos(((sliceAngles[i] - 90) * Math.PI) / 180)}
                    y1={centerY + (donutRadius - 10) * Math.sin(((sliceAngles[i] - 90) * Math.PI) / 180)}
                    x2={labelPositions[i].x}
                    y2={labelPositions[i].y}
                    stroke={d.color}
                    strokeWidth={2}
                  />
                  <SvgText
                    x={labelPositions[i].x}
                    y={labelPositions[i].y}
                    fill="#000"
                    fontSize="14"
                    fontWeight="700"
                    textAnchor={labelPositions[i].side === "right" ? "start" : "end"}
                  >
                    {`${d.label}: ${formatLabel(d.value)}`}
                  </SvgText>
                </React.Fragment>
              ))}

            {/* center total */}
            {showTotal && (
              <>
                <SvgText x={donutRadius + 40} y={donutRadius + 40} fill="#000" fontSize="20" fontWeight="700" textAnchor="middle">
                  {formatLabel(total)}
                </SvgText>
                <SvgText x={donutRadius + 40} y={donutRadius + 60} fill="#555" fontSize="12" textAnchor="middle">
                  Total
                </SvgText>
              </>
            )}
          </Svg>
        </View>

        {labelPosition === "right" && renderSideLabels("right")}
      </View>

      {/* modal */}
      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
          <View style={[styles.modalContainer, { backgroundColor: selectedSlice.color }]}>
            <Text style={[styles.modalTitle, { color: "#fff" }]}>{selectedSlice.label}</Text>
            <Text style={[styles.modalValue, { color: "#fff" }]}>{formatLabel(selectedSlice.value)}</Text>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: "#fff" }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.closeText, { color: selectedSlice.color }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center", paddingVertical: 10 },
  header: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  chartRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  sideContainer: { justifyContent: "center" },
  labelRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  colorTag: { width: 12, height: 12, borderRadius: 3, marginRight: 6 },
  sideLabel: { fontSize: 14, fontWeight: "700", color: "#000" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "70%", padding: 20, borderRadius: 12, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  modalValue: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  closeButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  closeText: { fontWeight: "700" },
});
