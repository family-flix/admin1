import { createCollection, editCollection, fetchCollectionProfile } from "@/services/collection";
import { InputCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { BaseDomain, Handler } from "@/domains/base";
import { MovieSelectCore } from "@/components/MovieSelect";
import { TVSeasonSelectCore } from "@/components/SeasonSelect";
import { MediaTypes } from "@/constants";

enum Events {
  StateChange,
  Loading,
}
type TheTypesOfEvents = {
  [Events.StateChange]: CollectionState;
  [Events.Loading]: boolean;
};
type CollectionMedia = {
  id: string;
  type: number;
  name: string;
  poster_path: string;
};
type CollectionState = {
  title: string;
  desc?: string;
  sort: number;
  medias: CollectionMedia[];
};
type CollectionProps = {};

export class CollectionFormCore extends BaseDomain<TheTypesOfEvents> {
  fields: {
    title: InputCore<string>;
    desc: InputCore<string>;
    sort: InputCore<number>;
  };
  createRequest = new RequestCore(createCollection, {
    onLoading: (loading) => {
      this.emit(Events.Loading, loading);
    },
    onSuccess: () => {
      this.tip({
        text: ["编辑成功"],
      });
    },
    onFailed: (error) => {
      this.tip({
        text: ["编辑失败", error.message],
      });
    },
  });
  updateRequest = new RequestCore(editCollection, {
    onLoading: (loading) => {
      this.emit(Events.Loading, loading);
    },
    onSuccess: () => {
      this.tip({
        text: ["编辑成功"],
      });
    },
    onFailed: (error) => {
      this.tip({
        text: ["编辑失败", error.message],
      });
    },
  });
  profileRequest = new RequestCore(fetchCollectionProfile, {
    onLoading: (loading) => {
      this.emit(Events.Loading, loading);
    },
    onSuccess: (v) => {
      const { title, desc = "", sort = 0, medias } = v;
      this.fields.title.setValue(title);
      this.fields.desc.setValue(desc);
      this.fields.sort.setValue(sort);
      const seasons = medias.map((media) => {
        const { id, type, name, poster_path } = media;
        return {
          id,
          type,
          name,
          poster_path,
        };
      });
      this.selectedSeasonsRef.select(seasons);
      this.emit(Events.StateChange, { ...this.state });
    },
  });
  selectedSeasonsRef = new RefCore({
    defaultValue: [] as CollectionMedia[],
  });
  seasonSelect = new TVSeasonSelectCore({
    onOk: () => {
      const selectedSeason = this.seasonSelect.value;
      if (!selectedSeason) {
        this.tip({
          text: ["请选择电视剧"],
        });
        return;
      }
      const curSeasons = this.selectedSeasonsRef.value || [];
      if (curSeasons.find((season) => season.id === selectedSeason.id)) {
        return;
      }
      const { id, name, poster_path } = selectedSeason;
      this.selectedSeasonsRef.select(
        curSeasons.concat([
          {
            id,
            type: 1,
            name,
            poster_path,
          },
        ])
      );
      this.seasonSelect.dialog.hide();
      this.emit(Events.StateChange, { ...this.state });
    },
  });
  get seasonSelectDialog() {
    return this.seasonSelect.dialog;
  }
  movieSelect = new MovieSelectCore({
    onOk: () => {
      const selectedMovie = this.movieSelect.value;
      if (!selectedMovie) {
        this.tip({
          text: ["请选择电影"],
        });
        return;
      }
      const curSeasons = this.selectedSeasonsRef.value || [];
      if (curSeasons.find((movie) => movie.id === selectedMovie.id)) {
        return;
      }
      const { id, name, poster_path } = selectedMovie;
      this.selectedSeasonsRef.select(
        curSeasons.concat([
          {
            id,
            type: MediaTypes.Movie,
            name,
            poster_path,
          },
        ])
      );
      this.movieSelect.dialog.hide();
      this.emit(Events.StateChange, { ...this.state });
    },
  });
  get movieSelectDialog() {
    return this.movieSelect.dialog;
  }

  get state(): CollectionState {
    return {
      title: this.fields.title.value,
      desc: this.fields.desc.value,
      sort: this.fields.sort.value,
      medias: [...(this.selectedSeasonsRef.value || [])],
    };
  }

  constructor(props: CollectionProps) {
    super(props);

    const titleInput = new InputCore({
      defaultValue: "",
    });
    const descInput = new InputCore({
      defaultValue: "",
    });
    const sortInput = new InputCore({
      defaultValue: 0,
      type: "number",
    });

    this.fields = {
      title: titleInput,
      desc: descInput,
      sort: sortInput,
    };
  }

  removeMedia(media: CollectionMedia) {
    if (this.selectedSeasonsRef.value) {
      this.selectedSeasonsRef.select(
        this.selectedSeasonsRef.value.filter((item) => {
          return item.id !== media.id;
        })
      );
    }
    this.emit(Events.StateChange, { ...this.state });
  }

  async create() {
    const title = this.fields.title.value;
    const desc = this.fields.desc.value;
    const sort = this.fields.sort.value;
    const medias = this.state.medias;
    if (!title) {
      this.tip({
        text: ["请输入标题"],
      });
      return;
    }
    if (!medias.length) {
      this.tip({
        text: ["请选择集合内容"],
      });
      return;
    }
    this.createRequest.run({
      title,
      desc,
      sort,
      medias,
    });
  }

  async edit(id: string) {
    const title = this.fields.title.value;
    const desc = this.fields.desc.value;
    const sort = this.fields.sort.value;
    const medias = this.state.medias;
    if (!title) {
      this.tip({
        text: ["请输入标题"],
      });
      return;
    }
    if (!medias?.length) {
      this.tip({
        text: ["请选择集合内容"],
      });
      return;
    }
    this.updateRequest.run({
      collection_id: id,
      title,
      desc,
      sort,
      medias,
    });
  }

  onLoading(handler: Handler<TheTypesOfEvents[Events.Loading]>) {
    return this.on(Events.Loading, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
