import React, { useEffect, useState } from "react";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
} from "react-native-reanimated";
import {
    SafeAreaView,
    StyleSheet,
    Image,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import MovementIndicator from "./modal";
import useDetector from "./useDetector";

const App = () => {
    const { requestStatus, requestData } = useDetector();
    const [loading, setLoading] = useState<boolean>(true);
    const [serverUp, setServerUp] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(false);
    const [stats, setStats] = useState<object>({ tool: "" });

    const connectedIcon = require("./assets/connect.png");
    const disconnectedIcon = require("./assets/disconnect.png");

    const upIcon = require("./assets/up.png");
    const downIcon = require("./assets/down.png");

    const offsetDown = useSharedValue(-25);

    const offsetUp = useSharedValue(75);

    const animatedStylesDown = useAnimatedStyle(() => ({
        transform: [{ translateY: offsetDown.value }],
    }));

    const animatedStylesUp = useAnimatedStyle(() => ({
        transform: [{ translateY: offsetUp.value }],
    }));

    const checkServer = () => {
        setTimeout(async () => {
            const status = await requestStatus();
            setServerUp(status);
            setLoading(false);
        }, 1500);
    };

    useEffect(() => {
        offsetDown.value = withRepeat(
            withTiming(offsetDown.value + 50, { duration: 1500 }),
            -1,
            true
        );

        offsetUp.value = withRepeat(
            withTiming(offsetUp.value - 50, { duration: 1500 }),
            -1,
            true
        );

        checkServer();
    }, []);

    useEffect(() => {
        if (serverUp) {
            setInterval(async () => {
                const res = await requestData();
                setStats({ ...stats, ...res });
            }, 1000);
        }
    }, [serverUp]);

    const retry = () => {
        setLoading(true);
        setTimeout(async () => {
            const status = await requestStatus();
            setServerUp(status);
            setLoading(false);
        }, 1500);
    };

    const hideModal = () => {
        setLoading(true);
        setServerUp(false);
        setVisible(false);
        checkServer();
    };

    const openModal = async () => {
        setVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.titleWrapper}>
                {visible ? (
                    <>
                        {stats.tool.toLowerCase() !== "stationary" &&
                        stats.direction ? (
                            <Animated.View
                                style={
                                    stats.direction.toLowerCase() === "up"
                                        ? animatedStylesUp
                                        : animatedStylesDown
                                }
                            >
                                <Image
                                    source={
                                        stats.direction.toLowerCase() === "up"
                                            ? upIcon
                                            : downIcon
                                    }
                                />
                            </Animated.View>
                        ) : (
                            ""
                        )}
                        <MovementIndicator tool={stats.tool} />
                        {/* <Text style={styles.floorsTitleText}>
                            Floors Counter
                        </Text>
                        <Text style={styles.floorsText}>{stats.floors}</Text> */}
                    </>
                ) : loading ? (
                    <>
                        <Text style={styles.titleText}>
                            Checking Device Status
                        </Text>
                        <ActivityIndicator size='large' color='#FF6060' />
                    </>
                ) : (
                    <>
                        <Text style={styles.titleText}>
                            Server is {serverUp ? "running" : "down"}
                        </Text>
                        <Image
                            source={serverUp ? connectedIcon : disconnectedIcon}
                            style={{ marginTop: 20 }}
                        />
                    </>
                )}
            </View>
            <TouchableOpacity
                onPress={
                    loading
                        ? () => {}
                        : visible
                        ? hideModal
                        : serverUp
                        ? openModal
                        : retry
                }
                style={{
                    ...styles.ctaButton,
                    backgroundColor: loading
                        ? "#ccc"
                        : !serverUp
                        ? "#FF6060"
                        : visible
                        ? "#FF6060"
                        : "#00cc00",
                }}
            >
                <Text style={styles.ctaButtonText}>
                    {loading
                        ? "Next"
                        : !serverUp
                        ? "Retry"
                        : visible
                        ? "Back"
                        : "Next"}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f2f2f2",
    },
    titleWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    titleText: {
        fontSize: 25,
        fontWeight: "bold",
        fontFamily: "roboto",
        textAlign: "center",
        marginHorizontal: 20,
        marginBottom: 20,
        color: "black",
    },
    text: {
        fontSize: 25,
        marginTop: 15,
    },

    floorsTitleText: {
        fontSize: 25,
        fontWeight: "bold",
        fontFamily: "roboto",
        textAlign: "center",
        marginHorizontal: 20,
        color: "black",
    },
    floorsText: {
        fontSize: 40,
        fontWeight: "bold",
        fontFamily: "roboto",
    },
    ctaButton: {
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        marginHorizontal: 20,
        marginBottom: 5,
        borderRadius: 8,
    },
    ctaButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "roboto",
        color: "white",
    },
});

export default App;
